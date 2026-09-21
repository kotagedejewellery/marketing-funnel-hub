"use server";

import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDatabase } from "@/lib/db/client";
import { auditLogs, campaigns, products, siteSettings } from "@/lib/db/schema";
import { serverEnv } from "@/lib/env/server";
import { createPrivilegedSupabase } from "@/lib/supabase/server";
import { requireAdmin } from "@/modules/admin/access";

import { imageExtension, maxImageBytes, mediaTargetSchema } from "./validation";

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
      : entityType === "campaign"
        ? await db
            .select({ id: campaigns.id })
            .from(campaigns)
            .where(eq(campaigns.id, entityId))
            .limit(1)
        : await db
            .select({ id: products.id })
            .from(products)
            .where(eq(products.id, entityId))
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
      } else if (entityType === "campaign") {
        await tx
          .update(campaigns)
          .set({ bannerPath: path, updatedAt: new Date() })
          .where(eq(campaigns.id, entityId));
      } else {
        await tx
          .update(products)
          .set({ imagePath: path, updatedAt: new Date() })
          .where(eq(products.id, entityId));
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
              : entityType === "campaign"
                ? "bannerPath"
                : "imagePath",
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
  revalidatePath(
    entityType === "site"
      ? "/admin/settings"
      : entityType === "campaign"
        ? `/admin/campaigns/${entityId}`
        : `/admin/products/${entityId}`,
  );
  return { ok: true, message: "Gambar berhasil diunggah." };
}
