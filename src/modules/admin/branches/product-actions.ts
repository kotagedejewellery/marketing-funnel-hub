"use server";

import { and, asc, eq, max } from "drizzle-orm";
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

const addExistingProductSchema = z.object({
  branchId: z.uuid(),
  productId: z.uuid(),
});

const createBranchProductSchema = z.object({
  branchId: z.uuid(),
  name: z.string().trim().min(1, "Nama produk wajib diisi.").max(120),
  description: z
    .string()
    .trim()
    .max(2000)
    .transform((value) => value || null),
});

function createProductSlug(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function revalidateBranchProductContent(branchId: string, branchSlug: string) {
  revalidatePath(`/${branchSlug}`);
  revalidatePath(`/admin/branches/${branchId}/link-bio`);
  revalidatePath("/admin/link-bio");
  revalidatePath("/admin");
}

export async function addExistingProductToBranch(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireAdmin();
  const parsed = addExistingProductSchema.safeParse({
    branchId: formData.get("branchId"),
    productId: formData.get("productId"),
  });
  if (!parsed.success) {
    return {
      message: "Pilih jenis produk yang valid.",
      errors: Object.fromEntries(
        parsed.error.issues.map((issue) => [
          String(issue.path[0]),
          issue.message,
        ]),
      ),
    };
  }

  const { branchId, productId } = parsed.data;
  const db = getDatabase();
  const [branch, product, existing] = await Promise.all([
    db
      .select({ id: branches.id, slug: branches.slug })
      .from(branches)
      .where(eq(branches.id, branchId))
      .limit(1),
    db
      .select({ id: products.id, isActive: products.isActive })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1),
    db
      .select({ id: productBranches.id, isActive: productBranches.isActive })
      .from(productBranches)
      .where(
        and(
          eq(productBranches.branchId, branchId),
          eq(productBranches.productId, productId),
        ),
      )
      .limit(1),
  ]);
  if (!branch[0] || !product[0]) {
    return { message: "Cabang atau jenis produk tidak ditemukan.", errors: {} };
  }
  if (!product[0].isActive) {
    return {
      message: "Jenis produk ini masih nonaktif.",
      errors: { productId: "Aktifkan jenis produk sebelum menambahkannya." },
    };
  }
  if (existing[0]?.isActive) {
    return {
      message: "Jenis produk ini sudah tampil pada cabang.",
      errors: { productId: "Pilih jenis produk lain." },
    };
  }

  try {
    await db.transaction(async (tx) => {
      const [lastOrder] = await tx
        .select({ value: max(productBranches.sortOrder) })
        .from(productBranches)
        .where(eq(productBranches.branchId, branchId));
      const sortOrder = Number(lastOrder?.value ?? -1) + 1;

      if (existing[0]) {
        await tx
          .update(productBranches)
          .set({ isActive: true, sortOrder, updatedAt: new Date() })
          .where(eq(productBranches.id, existing[0].id));
      } else {
        await tx.insert(productBranches).values({
          branchId,
          productId,
          isActive: true,
          sortOrder,
        });
      }
      await tx.insert(auditLogs).values({
        adminId: profile.id,
        action: existing[0] ? "activate" : "assign",
        entityType: "product_branches",
        entityId: productId,
        changes: { branchId },
      });
    });
  } catch {
    return {
      message: "Tombol WhatsApp gagal ditambahkan. Coba lagi.",
      errors: {},
    };
  }

  revalidateBranchProductContent(branchId, branch[0].slug);
  return {
    message: "Tombol WhatsApp berhasil ditambahkan.",
    errors: {},
    ok: true,
  };
}

export async function createProductForBranch(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireAdmin();
  const parsed = createBranchProductSchema.safeParse({
    branchId: formData.get("branchId"),
    name: formData.get("name"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    return {
      message: "Periksa kembali jenis produk baru.",
      errors: Object.fromEntries(
        parsed.error.issues.map((issue) => [
          String(issue.path[0]),
          issue.message,
        ]),
      ),
    };
  }

  const input = parsed.data;
  const slug = createProductSlug(input.name);
  if (!slug) {
    return {
      message: "Nama produk belum dapat digunakan.",
      errors: { name: "Gunakan nama yang memuat huruf atau angka." },
    };
  }

  const db = getDatabase();
  const [branch, duplicate] = await Promise.all([
    db
      .select({ id: branches.id, slug: branches.slug })
      .from(branches)
      .where(eq(branches.id, input.branchId))
      .limit(1),
    db
      .select({ id: products.id, isActive: products.isActive })
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1),
  ]);
  if (!branch[0]) return { message: "Cabang tidak ditemukan.", errors: {} };
  if (duplicate[0]) {
    return {
      message: "Jenis produk tersebut sudah tersedia.",
      errors: {
        name: duplicate[0].isActive
          ? "Pilih jenis produk yang sudah ada dari daftar di atas."
          : "Aktifkan jenis produk melalui bagian Kelola jenis produk bersama.",
      },
    };
  }

  try {
    await db.transaction(async (tx) => {
      const [lastProductOrder, lastAssignmentOrder] = await Promise.all([
        tx.select({ value: max(products.sortOrder) }).from(products),
        tx
          .select({ value: max(productBranches.sortOrder) })
          .from(productBranches)
          .where(eq(productBranches.branchId, input.branchId)),
      ]);
      const [created] = await tx
        .insert(products)
        .values({
          name: input.name,
          slug,
          description: input.description,
          isActive: true,
          sortOrder: Number(lastProductOrder[0]?.value ?? -1) + 1,
        })
        .returning({ id: products.id });
      if (!created) throw new Error("Product insert returned no row.");

      await tx.insert(productBranches).values({
        branchId: input.branchId,
        productId: created.id,
        isActive: true,
        sortOrder: Number(lastAssignmentOrder[0]?.value ?? -1) + 1,
      });
      await tx.insert(auditLogs).values([
        {
          adminId: profile.id,
          action: "create",
          entityType: "products",
          entityId: created.id,
          changes: { fields: ["name", "slug", "description", "isActive"] },
        },
        {
          adminId: profile.id,
          action: "assign",
          entityType: "product_branches",
          entityId: created.id,
          changes: { branchId: input.branchId },
        },
      ]);
    });
  } catch {
    return {
      message: "Jenis produk baru gagal dibuat. Coba lagi.",
      errors: {},
    };
  }

  revalidateBranchProductContent(input.branchId, branch[0].slug);
  return {
    message: "Jenis produk dan tombol WhatsApp berhasil dibuat.",
    errors: {},
    ok: true,
  };
}

export async function saveBranchProduct(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireAdmin();
  const parsed = branchProductSchema.safeParse({
    productId: formData.get("productId"),
    branchId: formData.get("branchId"),
    isActive: formData.get("isActive") === "on",
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

  revalidateBranchProductContent(input.branchId, branch[0].slug);
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
  revalidateBranchProductContent(branchId, branch.slug);
  return { message: "Urutan produk diperbarui.", errors: {}, ok: true };
}
