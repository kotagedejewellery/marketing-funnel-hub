"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as z from "zod";

import { getDatabase } from "@/lib/db/client";
import { adminProfiles, auditLogs } from "@/lib/db/schema";
import { createPrivilegedSupabase } from "@/lib/supabase/server";
import { requireTechnicalAdmin } from "@/modules/admin/access";

const inputSchema = z.strictObject({
  id: z.uuid(),
  displayName: z.string().trim().max(120),
  role: z.enum(["admin", "technical_admin"]),
  isActive: z.boolean(),
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
    displayName: formData.get("displayName"),
    role: formData.get("role"),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0]);
      errors[field] =
        field === "id"
          ? "Masukkan ID pengguna Auth dalam format UUID."
          : field === "displayName"
            ? "Nama tampilan maksimal 120 karakter."
            : "Pilih peran yang valid.";
    }
    return { message: "Periksa isian yang ditandai.", errors };
  }
  const input = parsed.data;
  if (input.id === actor.id) {
    return {
      message: "Profil Anda sendiri tidak dapat diubah dari halaman ini.",
      errors: {},
    };
  }

  const { data, error } =
    await createPrivilegedSupabase().adminAuth.getUserById(input.id);
  if (error || !data.user?.email) {
    return {
      message: "ID tidak ditemukan sebagai pengguna Supabase Auth aktif dengan email.",
      errors: { id: "Periksa kembali ID pengguna di Supabase Auth." },
    };
  }

  const db = getDatabase();
  try {
    await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({
          id: adminProfiles.id,
          role: adminProfiles.role,
          isActive: adminProfiles.isActive,
        })
        .from(adminProfiles)
        .where(eq(adminProfiles.id, input.id))
        .limit(1);
      const values = {
        displayName: input.displayName || null,
        role: input.role,
        isActive: input.isActive,
        updatedAt: new Date(),
      };
      if (existing) {
        await tx
          .update(adminProfiles)
          .set(values)
          .where(eq(adminProfiles.id, input.id));
      } else {
        await tx.insert(adminProfiles).values({ id: input.id, ...values });
      }
      await tx.insert(auditLogs).values({
        adminId: actor.id,
        action: existing
          ? existing.isActive && !input.isActive
            ? "deactivate"
            : !existing.isActive && input.isActive
              ? "activate"
              : "update"
          : "create",
        entityType: "admin_profiles",
        entityId: input.id,
        changes: { fields: ["displayName", "role", "isActive"] },
      });
    });
  } catch {
    return { message: "Profil gagal disimpan. Coba lagi.", errors: {} };
  }
  revalidatePath("/admin/profiles");
  redirect("/admin/profiles?saved=1");
}
