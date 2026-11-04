"use server";

import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";

import { getDatabase } from "@/lib/db/client";
import { adminProfiles, adminSessions, auditLogs } from "@/lib/db/schema";
import { requireTechnicalAdmin } from "@/modules/admin/access";
import { hashAdminPassword } from "@/modules/admin/auth";

const optionalId = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.uuid().optional(),
);
const inputSchema = z
  .strictObject({
    id: optionalId,
    email: z.email("Masukkan alamat email yang valid."),
    password: z.string().max(128),
    displayName: z.string().trim().max(120),
    role: z.enum(["admin", "technical_admin"]),
    isActive: z.boolean(),
  })
  .superRefine((input, context) => {
    if (!input.id && input.password.length < 12) {
      context.addIssue({
        code: "custom",
        path: ["password"],
        message: "Kata sandi baru minimal 12 karakter.",
      });
    }
    if (input.id && input.password && input.password.length < 12) {
      context.addIssue({
        code: "custom",
        path: ["password"],
        message: "Kata sandi baru minimal 12 karakter.",
      });
    }
  });

export type ProfileActionState = {
  message: string;
  errors: Record<string, string>;
};

export async function saveAdminProfile(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const actor = await requireTechnicalAdmin();
  const parsed = inputSchema.safeParse({
    id: formData.get("id"),
    email: formData.get("email"),
    password: formData.get("password"),
    displayName: formData.get("displayName"),
    role: formData.get("role"),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) {
    return {
      message: "Periksa isian yang ditandai.",
      errors: Object.fromEntries(
        parsed.error.issues.map((issue) => [
          String(issue.path[0]),
          issue.message,
        ]),
      ),
    };
  }

  const input = { ...parsed.data, email: parsed.data.email.toLowerCase() };
  if (input.id === actor.id && (input.role !== actor.role || !input.isActive)) {
    return {
      message:
        "Anda tidak dapat mengubah peran atau menonaktifkan akun sendiri.",
      errors: {},
    };
  }

  const db = getDatabase();
  const id = input.id ?? randomUUID();
  const [existing, sameEmail] = await Promise.all([
    input.id
      ? db
          .select({ id: adminProfiles.id, isActive: adminProfiles.isActive })
          .from(adminProfiles)
          .where(eq(adminProfiles.id, input.id))
          .limit(1)
      : Promise.resolve([]),
    db
      .select({ id: adminProfiles.id })
      .from(adminProfiles)
      .where(eq(adminProfiles.email, input.email))
      .limit(1),
  ]);
  if (input.id && !existing[0]) {
    return { message: "Profil tidak ditemukan.", errors: {} };
  }
  if (sameEmail[0] && sameEmail[0].id !== id) {
    return {
      message: "Email sudah dipakai oleh profil admin lain.",
      errors: { email: "Gunakan email lain." },
    };
  }

  const passwordHash = input.password
    ? await hashAdminPassword(input.password)
    : undefined;
  const values = {
    email: input.email,
    displayName: input.displayName || null,
    role: input.role,
    isActive: input.isActive,
    ...(passwordHash ? { passwordHash } : {}),
    updatedAt: new Date(),
  };
  try {
    await db.transaction(async (tx) => {
      if (existing[0]) {
        await tx
          .update(adminProfiles)
          .set(values)
          .where(eq(adminProfiles.id, id));

        if (passwordHash) {
          await tx.delete(adminSessions).where(eq(adminSessions.adminId, id));
        }
      } else {
        await tx.insert(adminProfiles).values({ id, ...values });
      }
      await tx.insert(auditLogs).values({
        adminId: actor.id,
        action: existing[0]
          ? existing[0].isActive && !input.isActive
            ? "deactivate"
            : !existing[0].isActive && input.isActive
              ? "activate"
              : "update"
          : "create",
        entityType: "admin_profiles",
        entityId: id,
        changes: {
          fields: [
            "email",
            "displayName",
            "role",
            "isActive",
            ...(passwordHash ? ["password"] : []),
          ],
        },
      });
    });
  } catch {
    return { message: "Profil gagal disimpan. Coba lagi.", errors: {} };
  }
  revalidatePath("/admin/profiles");
  redirect("/admin/profiles?saved=1");
}
