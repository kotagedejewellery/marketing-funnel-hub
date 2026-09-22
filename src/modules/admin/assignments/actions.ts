"use server";

import { and, eq } from "drizzle-orm";
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

import { assignmentSchema } from "./validation";

type ActionState = {
  message: string;
  errors: Record<string, string>;
  ok?: boolean;
};

export async function saveProductAssignments(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireAdmin();
  const productId = formData.get("productId");
  if (typeof productId !== "string" || !z.uuid().safeParse(productId).success) {
    return { message: "Produk tidak valid.", errors: {} };
  }
  const db = getDatabase();
  const [product] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);
  if (!product) return { message: "Produk tidak ditemukan.", errors: {} };
  const branchRows = await db
    .select({ id: branches.id, isActive: branches.isActive })
    .from(branches);
  const changes: z.infer<typeof assignmentSchema>[] = [];
  const errors: Record<string, string> = {};
  for (const branch of branchRows) {
    const id = branch.id;
    const parsed = assignmentSchema.safeParse({
      productId,
      branchId: id,
      isActive: formData.get(`active:${id}`) === "on",
      sortOrder: formData.get(`order:${id}`),
      ctaLabel: formData.get(`cta:${id}`),
      displayName: formData.get(`name:${id}`),
      description: formData.get(`description:${id}`),
      whatsappMessageTemplate: formData.get(`message:${id}`),
    });
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors[`${id}:${String(issue.path[0])}`] = issue.message;
      }
    } else if (parsed.data.isActive && !branch.isActive) {
      errors[`${id}:isActive`] =
        "Aktifkan cabang ini dahulu sebelum menampilkannya pada produk.";
    } else {
      changes.push(parsed.data);
    }
  }
  if (Object.keys(errors).length > 0) {
    return { message: "Periksa kembali penugasan cabang.", errors };
  }

  try {
    await db.transaction(async (tx) => {
      const current = await tx
        .select()
        .from(productBranches)
        .where(eq(productBranches.productId, productId));
      const existingByBranchId = new Map(
        current.map((row) => [row.branchId, row]),
      );
      const changedBranchIds: string[] = [];
      for (const input of changes) {
        const previous = existingByBranchId.get(input.branchId);
        if (!previous && !input.isActive) continue;
        const values = {
          isActive: input.isActive,
          sortOrder: input.sortOrder,
          ctaLabel: input.ctaLabel,
          displayName: input.displayName,
          description: input.description,
          whatsappMessageTemplate: input.whatsappMessageTemplate,
        };
        if (previous) {
          if (
            Object.entries(values).every(
              ([key, value]) => previous[key as keyof typeof values] === value,
            )
          )
            continue;
          await tx
            .update(productBranches)
            .set({ ...values, updatedAt: new Date() })
            .where(
              and(
                eq(productBranches.productId, productId),
                eq(productBranches.branchId, input.branchId),
              ),
            );
        } else {
          await tx
            .insert(productBranches)
            .values({ productId, branchId: input.branchId, ...values });
        }
        changedBranchIds.push(input.branchId);
      }
      if (changedBranchIds.length > 0) {
        await tx.insert(auditLogs).values({
          adminId: profile.id,
          action: "update",
          entityType: "product_branches",
          entityId: productId,
          changes: { branchIds: changedBranchIds },
        });
      }
    });
  } catch {
    return { message: "Gagal menyimpan cabang produk. Coba lagi.", errors: {} };
  }

  revalidatePath("/");
  revalidatePath("/b/[slug]", "page");
  revalidatePath("/admin/branches/[id]/link-bio", "page");
  revalidatePath(`/admin/products/${productId}`);
  return { message: "Penugasan cabang tersimpan.", errors: {}, ok: true };
}
