"use server";

import * as z from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDatabase } from "@/lib/db/client";
import {
  auditLogs,
  branches,
  branchMetaTrackingConfigs,
} from "@/lib/db/schema";
import {
  encryptMetaCapiToken,
  type BranchMetaTrackingMode,
} from "@/modules/tracking/branch-meta-config";
import { metaStandardEventNames } from "@/modules/tracking/meta-event";
import { requireTechnicalAdmin } from "@/modules/admin/access";

const branchMetaTrackingSchema = z.object({
  branchId: z.uuid(),
  mode: z.enum(["inherit", "custom", "disabled"]),
  pixelId: z.string().trim(),
  datasetId: z.string().trim(),
  capiAccessToken: z.string().trim(),
  pageLoadMetaEvent: z.enum(metaStandardEventNames).nullable(),
  confirmCustomConfigRemoval: z.boolean(),
});

export type BranchMetaTrackingActionState = {
  message: string;
  errors: Record<string, string>;
  ok?: boolean;
};

function validationErrors(error: z.ZodError) {
  return Object.fromEntries(
    error.issues.map((issue) => [String(issue.path[0]), issue.message]),
  );
}

export async function saveBranchMetaTrackingConfig(
  _previous: BranchMetaTrackingActionState,
  formData: FormData,
): Promise<BranchMetaTrackingActionState> {
  const profile = await requireTechnicalAdmin();
  const parsed = branchMetaTrackingSchema.safeParse({
    branchId: formData.get("branchId"),
    mode: formData.get("mode"),
    pixelId: formData.get("pixelId") ?? "",
    datasetId: formData.get("datasetId") ?? "",
    capiAccessToken: formData.get("capiAccessToken") ?? "",
    pageLoadMetaEvent: (formData.get("pageLoadMetaEvent") || null) as
      (typeof metaStandardEventNames)[number] | null,
    confirmCustomConfigRemoval:
      formData.get("confirmCustomConfigRemoval") === "true",
  });
  if (!parsed.success) {
    return {
      message: "Pengaturan Meta belum tersimpan.",
      errors: validationErrors(parsed.error),
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

  const [current] = await db
    .select({
      branchId: branchMetaTrackingConfigs.branchId,
      mode: branchMetaTrackingConfigs.mode,
      capiAccessTokenEncrypted:
        branchMetaTrackingConfigs.capiAccessTokenEncrypted,
    })
    .from(branchMetaTrackingConfigs)
    .where(eq(branchMetaTrackingConfigs.branchId, input.branchId))
    .limit(1);

  if (input.mode === "custom") {
    const errors: Record<string, string> = {};
    if (!/^\d+$/.test(input.pixelId))
      errors.pixelId = "Pixel ID harus berupa angka.";
    if (!/^\d+$/.test(input.datasetId))
      errors.datasetId = "Dataset ID harus berupa angka.";
    if (!input.capiAccessToken && !current?.capiAccessTokenEncrypted)
      errors.capiAccessToken = "Masukkan token CAPI untuk konfigurasi baru.";
    if (input.capiAccessToken && input.capiAccessToken.length < 16)
      errors.capiAccessToken = "Token CAPI minimal terdiri dari 16 karakter.";
    if (Object.keys(errors).length) {
      return { message: "Periksa konfigurasi Meta.", errors };
    }
  }

  if (
    current?.mode === "custom" &&
    input.mode !== "custom" &&
    !input.confirmCustomConfigRemoval
  ) {
    return {
      message: "Konfirmasi diperlukan sebelum kredensial Meta khusus dihapus.",
      errors: { mode: "Konfirmasikan penghapusan kredensial khusus." },
    };
  }

  try {
    const values = await (async () => {
      const mode = input.mode as BranchMetaTrackingMode;
      if (mode === "disabled") {
        return {
          mode,
          pixelId: null,
          datasetId: null,
          capiAccessTokenEncrypted: null,
          pageViewEnabled: false,
          pageLoadMetaEvent: null,
          updatedAt: new Date(),
        };
      }
      if (mode === "inherit") {
        return {
          mode,
          pixelId: null,
          datasetId: null,
          capiAccessTokenEncrypted: null,
          pageViewEnabled: Boolean(input.pageLoadMetaEvent),
          pageLoadMetaEvent: input.pageLoadMetaEvent,
          updatedAt: new Date(),
        };
      }
      return {
        mode,
        pixelId: input.pixelId,
        datasetId: input.datasetId,
        capiAccessTokenEncrypted: input.capiAccessToken
          ? encryptMetaCapiToken(input.capiAccessToken)
          : current!.capiAccessTokenEncrypted,
        pageViewEnabled: Boolean(input.pageLoadMetaEvent),
        pageLoadMetaEvent: input.pageLoadMetaEvent,
        updatedAt: new Date(),
      };
    })();

    await db.transaction(async (tx) => {
      if (current) {
        await tx
          .update(branchMetaTrackingConfigs)
          .set(values)
          .where(eq(branchMetaTrackingConfigs.branchId, input.branchId));
      } else {
        await tx
          .insert(branchMetaTrackingConfigs)
          .values({ branchId: input.branchId, ...values });
      }
      await tx.insert(auditLogs).values({
        adminId: profile.id,
        action: current ? "update" : "create",
        entityType: "branch_meta_tracking_configs",
        entityId: input.branchId,
        changes: {
          mode: input.mode,
          pixelConfigured: input.mode === "custom",
          datasetConfigured: input.mode === "custom",
          capiTokenChanged: Boolean(input.capiAccessToken),
          pageLoadMetaEvent: values.pageLoadMetaEvent,
        },
      });
    });
  } catch {
    return {
      message:
        "Pengaturan Meta belum tersimpan. Periksa kunci enkripsi server lalu coba lagi.",
      errors: {},
    };
  }

  revalidatePath("/");
  revalidatePath(`/${branch.slug}`);
  revalidatePath(`/admin/branches/${input.branchId}/link-bio`);
  return { message: "Pengaturan Meta cabang tersimpan.", errors: {}, ok: true };
}
