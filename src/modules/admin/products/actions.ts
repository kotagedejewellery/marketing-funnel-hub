"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDatabase } from "@/lib/db/client";
import { auditLogs, products } from "@/lib/db/schema";
import { requireAdmin } from "@/modules/admin/access";

import { productSchema } from "./validation";

type ActionState = {
  message: string;
  errors: Record<string, string>;
  ok?: boolean;
};

export async function saveProduct(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireAdmin();
  const parsed = productSchema.safeParse({
    ...Object.fromEntries(formData),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) {
    return {
      message: "Periksa kembali isian produk.",
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
    description: input.description,
    isActive: input.isActive,
    sortOrder: input.sortOrder,
  };
  const db = getDatabase();
  const [duplicate] = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.slug, input.slug), ne(products.id, input.id)))
    .limit(1);
  if (duplicate) {
    return {
      message: "Slug sudah digunakan.",
      errors: { slug: "Pilih slug lain." },
    };
  }

  let saved = false;
  try {
    saved = await db.transaction(async (tx) => {
      const [current] = await tx
        .select({ id: products.id })
        .from(products)
        .where(eq(products.id, input.id))
        .limit(1);
      if (!current) return false;
      await tx
        .update(products)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(products.id, input.id));
      await tx.insert(auditLogs).values({
        adminId: profile.id,
        action: "update",
        entityType: "products",
        entityId: input.id,
        changes: { fields: Object.keys(values) },
      });
      return true;
    });
  } catch {
    return {
      message: "Gagal menyimpan produk. Periksa slug lalu coba lagi.",
      errors: {},
    };
  }
  if (!saved) return { message: "Jenis produk tidak ditemukan.", errors: {} };

  revalidatePath("/[slug]", "page");
  revalidatePath("/admin/branches/[id]/link-bio", "page");
  revalidatePath("/admin/link-bio");
  revalidatePath("/admin");
  return {
    message: "Jenis produk bersama berhasil disimpan.",
    errors: {},
    ok: true,
  };
}
