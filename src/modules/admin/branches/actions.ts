"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDatabase } from "@/lib/db/client";
import { auditLogs, branches } from "@/lib/db/schema";
import { requireAdmin } from "@/modules/admin/access";

import { branchSchema } from "./validation";

type ActionState = { message: string; errors: Record<string, string> };

export async function saveBranch(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireAdmin();
  const parsed = branchSchema.safeParse({
    ...Object.fromEntries(formData),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) {
    return {
      message: "Periksa kembali isian cabang.",
      errors: Object.fromEntries(
        parsed.error.issues.map((issue) => [
          String(issue.path[0]),
          issue.message,
        ]),
      ),
    };
  }

  const input = parsed.data;
  const values = {
    name: input.name,
    slug: input.slug,
    whatsappNumber: input.whatsappNumber,
    ctaLabel: input.ctaLabel,
    isActive: input.isActive,
    sortOrder: input.sortOrder,
  };
  const db = getDatabase();
  const [duplicate] = await db
    .select({ id: branches.id })
    .from(branches)
    .where(
      input.id
        ? and(eq(branches.slug, input.slug), ne(branches.id, input.id))
        : eq(branches.slug, input.slug),
    )
    .limit(1);
  if (duplicate) {
    return {
      message: "Slug sudah digunakan.",
      errors: { slug: "Pilih slug lain." },
    };
  }

  let savedId: string;
  try {
    savedId = await db.transaction(async (tx) => {
      if (input.id) {
        const [current] = await tx
          .select({ id: branches.id })
          .from(branches)
          .where(eq(branches.id, input.id))
          .limit(1);
        if (!current) return "";
        await tx
          .update(branches)
          .set({ ...values, updatedAt: new Date() })
          .where(eq(branches.id, input.id));
        await tx.insert(auditLogs).values({
          adminId: profile.id,
          action: "update",
          entityType: "branches",
          entityId: input.id,
          changes: { fields: Object.keys(values) },
        });
        return input.id;
      }
      const [created] = await tx
        .insert(branches)
        .values(values)
        .returning({ id: branches.id });
      await tx.insert(auditLogs).values({
        adminId: profile.id,
        action: "create",
        entityType: "branches",
        entityId: created.id,
        changes: { fields: Object.keys(values) },
      });
      return created.id;
    });
  } catch {
    return {
      message: "Gagal menyimpan cabang. Periksa slug lalu coba lagi.",
      errors: {},
    };
  }
  if (!savedId) return { message: "Cabang tidak ditemukan.", errors: {} };

  revalidatePath("/");
  revalidatePath("/admin/branches");
  redirect("/admin/branches?saved=1");
}
