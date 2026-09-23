"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDatabase } from "@/lib/db/client";
import { auditLogs, products } from "@/lib/db/schema";
import { requireAdmin } from "@/modules/admin/access";

import { productSchema } from "./validation";

type ActionState = { message: string; errors: Record<string, string> };

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
    .where(
      input.id
        ? and(eq(products.slug, input.slug), ne(products.id, input.id))
        : eq(products.slug, input.slug),
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
          .select({ id: products.id })
          .from(products)
          .where(eq(products.id, input.id))
          .limit(1);
        if (!current) return "";
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
        return input.id;
      }
      const [created] = await tx
        .insert(products)
        .values(values)
        .returning({ id: products.id });
      await tx.insert(auditLogs).values({
        adminId: profile.id,
        action: "create",
        entityType: "products",
        entityId: created.id,
        changes: { fields: Object.keys(values) },
      });
      return created.id;
    });
  } catch {
    return {
      message: "Gagal menyimpan produk. Periksa slug lalu coba lagi.",
      errors: {},
    };
  }
  if (!savedId) return { message: "Produk tidak ditemukan.", errors: {} };

  revalidatePath("/");
  revalidatePath("/[slug]", "page");
  revalidatePath("/admin/branches/[id]/link-bio", "page");
  revalidatePath("/admin/products");
  redirect(`/admin/products/${savedId}?saved=1`);
}
