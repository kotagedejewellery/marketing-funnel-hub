"use server";

import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDatabase } from "@/lib/db/client";
import { auditLogs, branches, galleryItems } from "@/lib/db/schema";
import { serverEnv } from "@/lib/env/server";
import { createPrivilegedSupabase } from "@/lib/supabase/server";
import { requireAdmin } from "@/modules/admin/access";
import {
  imageExtension,
  maxImageBytes,
} from "@/modules/admin/media/validation";

import { galleryItemSchema } from "./validation";

type ActionState = {
  message: string;
  errors: Record<string, string>;
  ok?: boolean;
};

export async function saveGalleryItem(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireAdmin();
  const parsed = galleryItemSchema.safeParse({
    id: formData.get("id"),
    branchId: formData.get("branchId"),
    title: formData.get("title"),
    description: formData.get("description"),
    altText: formData.get("altText"),
    sortOrder: formData.get("sortOrder"),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) {
    return {
      message: "Periksa kembali isian galeri.",
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
  const [branch] = await db
    .select({ id: branches.id, slug: branches.slug })
    .from(branches)
    .where(eq(branches.id, input.branchId))
    .limit(1);
  if (!branch) return { message: "Cabang tidak ditemukan.", errors: {} };

  const [current] = input.id
    ? await db
        .select({ id: galleryItems.id, imagePath: galleryItems.imagePath })
        .from(galleryItems)
        .where(
          and(
            eq(galleryItems.id, input.id),
            eq(galleryItems.branchId, input.branchId),
          ),
        )
        .limit(1)
    : [null];
  if (input.id && !current) {
    return { message: "Gambar galeri tidak ditemukan.", errors: {} };
  }

  const file = formData.get("file");
  const hasFile = file instanceof File && file.size > 0;
  if (!current && !hasFile) {
    return {
      message: "Pilih gambar untuk item galeri baru.",
      errors: { file: "Gambar wajib dipilih." },
    };
  }

  let imagePath = current?.imagePath ?? "";
  if (hasFile) {
    if (file.size > maxImageBytes) {
      return {
        message: "Pilih gambar maksimal 5 MB.",
        errors: { file: "Ukuran gambar melebihi 5 MB." },
      };
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const extension = imageExtension(file.type, bytes);
    if (!extension) {
      return {
        message: "Gunakan gambar JPEG, PNG, atau WebP yang valid.",
        errors: { file: "Format gambar tidak didukung." },
      };
    }
    imagePath = `gallery/${input.branchId}/${randomUUID()}.${extension}`;
    try {
      const { storage } = createPrivilegedSupabase();
      const { error } = await storage
        .from(serverEnv.SUPABASE_PUBLIC_ASSET_BUCKET)
        .upload(imagePath, bytes, { contentType: file.type, upsert: false });
      if (error) {
        return {
          message: "Unggah gambar gagal. Coba lagi.",
          errors: { file: "Gambar belum terunggah." },
        };
      }
    } catch {
      return {
        message: "Unggah gambar gagal. Coba lagi.",
        errors: { file: "Gambar belum terunggah." },
      };
    }
  }

  try {
    await db.transaction(async (tx) => {
      let savedId: string;
      if (current) {
        savedId = current.id;
        await tx
          .update(galleryItems)
          .set({
            imagePath,
            title: input.title,
            description: input.description,
            altText: input.altText,
            sortOrder: input.sortOrder,
            isActive: input.isActive,
            updatedAt: new Date(),
          })
          .where(eq(galleryItems.id, current.id));
      } else {
        const [created] = await tx
          .insert(galleryItems)
          .values({
            branchId: input.branchId,
            imagePath,
            title: input.title,
            description: input.description,
            altText: input.altText,
            sortOrder: input.sortOrder,
            isActive: input.isActive,
          })
          .returning({ id: galleryItems.id });
        savedId = created.id;
      }
      await tx.insert(auditLogs).values({
        adminId: profile.id,
        action: current ? "update" : "create",
        entityType: "gallery_items",
        entityId: savedId,
        changes: {
          branchId: input.branchId,
          fields: [
            ...(hasFile ? ["imagePath"] : []),
            "title",
            "description",
            "altText",
            "sortOrder",
            "isActive",
          ],
        },
      });
    });
  } catch {
    return {
      message: "Gambar terunggah, tetapi data galeri belum tersimpan.",
      errors: {},
    };
  }

  revalidatePath(`/${branch.slug}`);
  revalidatePath(`/admin/branches/${input.branchId}/link-bio`);
  return { message: "Galeri berhasil disimpan.", errors: {}, ok: true };
}
