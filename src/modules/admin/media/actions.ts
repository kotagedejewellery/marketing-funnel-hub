"use server";

import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDatabase } from "@/lib/db/client";
import { auditLogs, branches, campaigns, siteSettings } from "@/lib/db/schema";
import { serverEnv } from "@/lib/env/server";
import { createPrivilegedSupabase } from "@/lib/supabase/server";
import { requireAdmin } from "@/modules/admin/access";

import {
  imageExtension,
  maxImageBytes,
  mediaOverrideTargetSchema,
  mediaTargetSchema,
} from "./validation";

type ActionState = { message: string; ok: boolean };

export async function uploadMedia(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireAdmin();
  const target = mediaTargetSchema.safeParse({
    entityType: formData.get("entityType"),
    entityId: formData.get("entityId"),
  });
  const file = formData.get("file");
  if (!target.success) {
    return { ok: false, message: "Tujuan gambar tidak valid." };
  }
  if (!(file instanceof File) || file.size === 0 || file.size > maxImageBytes) {
    return { ok: false, message: "Pilih gambar maksimal 5 MB." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const extension = imageExtension(file.type, bytes);
  if (!extension) {
    return {
      ok: false,
      message: "Gunakan gambar JPEG, PNG, atau WebP yang valid.",
    };
  }

  const { entityType, entityId } = target.data;
  const db = getDatabase();
  const [existing] =
    entityType === "site"
      ? await db
          .select({ id: siteSettings.id })
          .from(siteSettings)
          .where(eq(siteSettings.id, entityId))
          .limit(1)
      : entityType === "branch"
        ? await db
            .select({ id: branches.id })
            .from(branches)
            .where(eq(branches.id, entityId))
            .limit(1)
        : await db
            .select({ id: campaigns.id })
            .from(campaigns)
            .where(eq(campaigns.id, entityId))
            .limit(1);
  if (!existing) return { ok: false, message: "Data tujuan tidak ditemukan." };

  const folder = entityType === "site" ? "brand" : `${entityType}s`;
  const path = `${folder}/${entityId}/${randomUUID()}.${extension}`;
  const { storage } = createPrivilegedSupabase();
  try {
    const { error } = await storage
      .from(serverEnv.SUPABASE_PUBLIC_ASSET_BUCKET)
      .upload(path, bytes, { contentType: file.type, upsert: false });
    if (error) return { ok: false, message: "Unggah gambar gagal. Coba lagi." };
  } catch {
    return { ok: false, message: "Unggah gambar gagal. Coba lagi." };
  }

  try {
    await db.transaction(async (tx) => {
      if (entityType === "site") {
        await tx
          .update(siteSettings)
          .set({ logoPath: path, updatedAt: new Date() })
          .where(eq(siteSettings.id, entityId));
      } else if (entityType === "branch") {
        await tx
          .update(branches)
          .set({ logoPath: path, updatedAt: new Date() })
          .where(eq(branches.id, entityId));
      } else {
        await tx
          .update(campaigns)
          .set({ bannerPath: path, updatedAt: new Date() })
          .where(eq(campaigns.id, entityId));
      }
      await tx.insert(auditLogs).values({
        adminId: profile.id,
        action: "update",
        entityType: entityType === "site" ? "site_settings" : `${entityType}s`,
        entityId,
        changes: {
          field:
            entityType === "site"
              ? "logoPath"
              : entityType === "branch"
                ? "logoPath"
                : "bannerPath",
        },
      });
    });
  } catch {
    return {
      ok: false,
      message: "Gambar terunggah, tetapi belum tersimpan. Coba lagi.",
    };
  }

  revalidatePath("/");
  revalidatePath("/[slug]", "page");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/branches/[id]/link-bio", "page");
  revalidatePath(
    entityType === "site"
      ? "/admin/settings"
      : entityType === "branch"
        ? `/admin/branches/${entityId}/link-bio`
        : `/admin/campaigns/${entityId}`,
  );
  return { ok: true, message: "Gambar berhasil diunggah." };
}

export async function clearMediaOverride(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireAdmin();
  const target = mediaOverrideTargetSchema.safeParse({
    entityType: formData.get("entityType"),
    entityId: formData.get("entityId"),
  });
  if (!target.success) {
    return { ok: false, message: "Tujuan gambar tidak valid." };
  }

  const db = getDatabase();
  const { entityType, entityId } = target.data;

  const [existing] = await db
    .select({
      id: branches.id,
      slug: branches.slug,
      logoPath: branches.logoPath,
    })
    .from(branches)
    .where(eq(branches.id, entityId))
    .limit(1);
  if (!existing) {
    return { ok: false, message: "Cabang tidak ditemukan." };
  }
  if (!existing.logoPath) {
    return { ok: true, message: "Logo sudah menggunakan gambar bawaan." };
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(branches)
        .set({ logoPath: null, updatedAt: new Date() })
        .where(eq(branches.id, entityId));
      await tx.insert(auditLogs).values({
        adminId: profile.id,
        action: "update",
        entityType: "branches",
        entityId,
        changes: { field: "logoPath", mode: "inherited" },
      });
    });
  } catch {
    return {
      ok: false,
      message: "Logo belum dapat dikembalikan ke gambar bawaan.",
    };
  }

  revalidatePath(`/${existing.slug}`);
  revalidatePath(`/admin/branches/${entityId}/link-bio`);
  return {
    ok: true,
    message: "Logo kembali mengikuti Pengaturan Bersama.",
  };
}
