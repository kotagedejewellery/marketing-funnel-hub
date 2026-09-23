"use server";

import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as z from "zod";

import { getDatabase } from "@/lib/db/client";
import {
  auditLogs,
  branches,
  productBranches,
  products,
} from "@/lib/db/schema";
import { requireAdmin } from "@/modules/admin/access";

import { branchProductSchema } from "./product-validation";

type ActionState = {
  message: string;
  errors: Record<string, string>;
  ok?: boolean;
};

export async function saveBranchProduct(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireAdmin();
  const parsed = branchProductSchema.safeParse({
    productId: formData.get("productId"),
    branchId: formData.get("branchId"),
    isActive: formData.get("isActive") === "on",
    showImage: formData.get("showImage") === "on",
    sortOrder: formData.get("sortOrder"),
    ctaLabel: formData.get("ctaLabel"),
    displayName: formData.get("displayName"),
    description: formData.get("description"),
    whatsappMessageTemplate: formData.get("whatsappMessageTemplate"),
  });
  if (!parsed.success) {
    return {
      message: "Periksa pengaturan produk cabang.",
      errors: Object.fromEntries(
        parsed.error.issues.map((issue) => [
          String(issue.path[0]),
          issue.message,
        ]),
      ),
    };
  }
  const input = parsed.data;
  const db = getDatabase();
  const [branch, product] = await Promise.all([
    db
      .select({
        id: branches.id,
        slug: branches.slug,
      })
      .from(branches)
      .where(eq(branches.id, input.branchId))
      .limit(1),
    db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, input.productId))
      .limit(1),
  ]);
  if (!branch[0] || !product[0])
    return { message: "Cabang atau produk tidak ditemukan.", errors: {} };

  try {
    await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ id: productBranches.id })
        .from(productBranches)
        .where(
          and(
            eq(productBranches.branchId, input.branchId),
            eq(productBranches.productId, input.productId),
          ),
        )
        .limit(1);
      const values = {
        isActive: input.isActive,
        showImage: input.showImage,
        sortOrder: input.sortOrder,
        displayName: input.displayName,
        description: input.description,
        ctaLabel: input.ctaLabel,
        whatsappMessageTemplate: input.whatsappMessageTemplate,
      };
      if (existing) {
        await tx
          .update(productBranches)
          .set({ ...values, updatedAt: new Date() })
          .where(eq(productBranches.id, existing.id));
      } else {
        await tx.insert(productBranches).values({
          branchId: input.branchId,
          productId: input.productId,
          ...values,
        });
      }
      await tx.insert(auditLogs).values({
        adminId: profile.id,
        action: existing ? "update" : "assign",
        entityType: "product_branches",
        entityId: input.productId,
        changes: {
          branchId: input.branchId,
          fields: [
            "isActive",
            "showImage",
            "sortOrder",
            "displayName",
            "description",
            "ctaLabel",
            "whatsappMessageTemplate",
          ],
        },
      });
    });
  } catch {
    return { message: "Produk cabang gagal disimpan. Coba lagi.", errors: {} };
  }

  revalidatePath(`/${branch[0].slug}`);
  revalidatePath(`/admin/branches/${input.branchId}/link-bio`);
  revalidatePath(`/admin/products/${input.productId}`);
  return { message: "Produk cabang tersimpan.", errors: {}, ok: true };
}

const moveSchema = z.object({
  branchId: z.uuid(),
  productId: z.uuid(),
  direction: z.enum(["up", "down"]),
});

export async function moveBranchProduct(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireAdmin();
  const parsed = moveSchema.safeParse({
    branchId: formData.get("branchId"),
    productId: formData.get("productId"),
    direction: formData.get("direction"),
  });
  if (!parsed.success)
    return { message: "Urutan produk tidak valid.", errors: {} };
  const { branchId, productId, direction } = parsed.data;
  const db = getDatabase();
  const [branch] = await db
    .select({ slug: branches.slug })
    .from(branches)
    .where(eq(branches.id, branchId))
    .limit(1);
  if (!branch) return { message: "Cabang tidak ditemukan.", errors: {} };

  try {
    const moved = await db.transaction(async (tx) => {
      const rows = await tx
        .select({
          id: productBranches.id,
          productId: productBranches.productId,
        })
        .from(productBranches)
        .where(
          and(
            eq(productBranches.branchId, branchId),
            eq(productBranches.isActive, true),
          ),
        )
        .orderBy(asc(productBranches.sortOrder), asc(productBranches.id));
      const index = rows.findIndex((row) => row.productId === productId);
      const other = direction === "up" ? index - 1 : index + 1;
      if (index < 0 || other < 0 || other >= rows.length) return false;
      [rows[index], rows[other]] = [rows[other], rows[index]];
      for (const [position, row] of rows.entries()) {
        await tx
          .update(productBranches)
          .set({ sortOrder: position, updatedAt: new Date() })
          .where(eq(productBranches.id, row.id));
      }
      await tx.insert(auditLogs).values({
        adminId: profile.id,
        action: "update",
        entityType: "product_branches",
        entityId: productId,
        changes: { branchId, field: "sortOrder" },
      });
      return true;
    });
    if (!moved) return { message: "Posisi produk tidak berubah.", errors: {} };
  } catch {
    return { message: "Urutan produk gagal disimpan.", errors: {} };
  }
  revalidatePath(`/${branch.slug}`);
  revalidatePath(`/admin/branches/${branchId}/link-bio`);
  return { message: "Urutan produk diperbarui.", errors: {}, ok: true };
}
