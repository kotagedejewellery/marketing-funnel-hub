"use server";

import { and, count, eq, max, ne, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDatabase } from "@/lib/db/client";
import {
  auditLogs,
  branches,
  branchGoogleReviews,
  branchMetaTrackingConfigs,
  branchPageBuilderLayouts,
  branchReviewSources,
  campaigns,
  contentSections,
  events,
  faqs,
  formSubmissions,
  galleryItems,
  links,
  pageBlocks,
  productBranches,
  siteSettings,
} from "@/lib/db/schema";
import { serverEnv } from "@/lib/env/server";
import { deletePublicAsset, deletePublicAssetTree } from "@/lib/media/server";
import { requireAdmin } from "@/modules/admin/access";
import { pageBuilderBlocksSchema } from "@/modules/page-builder/schema";

import { branchDeletionBlockReason } from "./deletion";
import { branchDeleteSchema, branchIdSchema, branchSchema } from "./validation";

type ActionState = {
  message: string;
  errors: Record<string, string>;
  ok?: boolean;
};

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
  };
  const db = getDatabase();
  if (input.id && !input.isActive) {
    const [settings] = await db
      .select({ defaultLinkBioBranchId: siteSettings.defaultLinkBioBranchId })
      .from(siteSettings)
      .limit(1);
    if (settings?.defaultLinkBioBranchId === input.id) {
      return {
        message: "Cabang ini masih menjadi halaman utama Link Bio.",
        errors: {
          isActive:
            "Pilih halaman utama lain terlebih dahulu di Standar & Template KGJ.",
        },
      };
    }
  }
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
          .select({ id: branches.id, sortOrder: branches.sortOrder })
          .from(branches)
          .where(eq(branches.id, input.id))
          .limit(1);
        if (!current) return "";
        await tx
          .update(branches)
          .set({
            ...values,
            sortOrder: current.sortOrder,
            updatedAt: new Date(),
          })
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
      const [lastOrder] = await tx
        .select({ value: max(branches.sortOrder) })
        .from(branches);
      const createValues = {
        ...values,
        sortOrder: Number(lastOrder?.value ?? -1) + 1,
      };
      const [created] = await tx
        .insert(branches)
        .values(createValues)
        .returning({ id: branches.id });
      await tx.insert(auditLogs).values({
        adminId: profile.id,
        action: "create",
        entityType: "branches",
        entityId: created.id,
        changes: { fields: Object.keys(createValues) },
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
  revalidatePath(`/${input.slug}`);
  revalidatePath("/admin/link-bio");
  redirect(`/admin/branches/${savedId}/link-bio?saved=1`);
}

function ownedMediaPath(path: string | null, prefix: string) {
  return path?.startsWith(prefix) ? path : null;
}

export async function deactivateBranch(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireAdmin();
  const parsed = branchIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { message: "Halaman tidak valid.", errors: {} };

  try {
    const result = await getDatabase().transaction(async (tx) => {
      const [branch] = await tx
        .select({
          id: branches.id,
          slug: branches.slug,
          isActive: branches.isActive,
        })
        .from(branches)
        .where(eq(branches.id, parsed.data.id))
        .limit(1);
      if (!branch)
        return { ok: false as const, message: "Halaman tidak ditemukan." };

      const [settings] = await tx
        .select({ id: siteSettings.id })
        .from(siteSettings)
        .where(eq(siteSettings.defaultLinkBioBranchId, branch.id))
        .limit(1);
      if (settings) {
        return {
          ok: false as const,
          message:
            "Pilih halaman utama lain sebelum menonaktifkan halaman ini.",
        };
      }
      if (!branch.isActive) {
        return { ok: true as const, slug: branch.slug, alreadyInactive: true };
      }
      await tx
        .update(branches)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(branches.id, branch.id));
      await tx.insert(auditLogs).values({
        adminId: profile.id,
        action: "update",
        entityType: "branches",
        entityId: branch.id,
        changes: { field: "isActive", value: false },
      });
      return { ok: true as const, slug: branch.slug, alreadyInactive: false };
    });
    if (!result.ok) return { message: result.message, errors: {} };

    revalidatePath("/");
    revalidatePath(`/${result.slug}`);
    revalidatePath("/admin/link-bio");
    return {
      message: result.alreadyInactive
        ? "Halaman sudah nonaktif."
        : "Halaman Link Bio dinonaktifkan.",
      errors: {},
      ok: true,
    };
  } catch {
    return { message: "Halaman belum dapat dinonaktifkan.", errors: {} };
  }
}

export async function deleteBranch(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireAdmin();
  const parsed = branchDeleteSchema.safeParse({
    id: formData.get("id"),
    confirmationSlug: formData.get("confirmationSlug"),
  });
  if (!parsed.success) {
    return {
      message: "Ketik slug halaman dengan benar untuk menghapusnya.",
      errors: {},
    };
  }

  const input = parsed.data;
  try {
    const deleted = await getDatabase().transaction(async (tx) => {
      const [branch] = await tx
        .select({
          id: branches.id,
          slug: branches.slug,
          logoPath: branches.logoPath,
        })
        .from(branches)
        .where(eq(branches.id, input.id))
        .limit(1);
      if (!branch || branch.slug !== input.confirmationSlug) {
        return {
          ok: false as const,
          message: "Halaman tidak ditemukan atau slug tidak cocok.",
        };
      }

      const settings = await tx
        .select({ id: siteSettings.id })
        .from(siteSettings)
        .where(eq(siteSettings.defaultLinkBioBranchId, branch.id))
        .limit(1);
      const eventCount = await tx
        .select({ value: count() })
        .from(events)
        .leftJoin(links, eq(events.linkId, links.id))
        .where(
          or(
            eq(events.branchId, branch.id),
            eq(links.branchId, branch.id),
            eq(
              events.pageUrl,
              `${new URL(serverEnv.NEXT_PUBLIC_SITE_URL).origin}/${branch.slug}`,
            ),
          ),
        );
      const submissionCount = await tx
        .select({ value: count() })
        .from(formSubmissions)
        .where(eq(formSubmissions.branchId, branch.id));
      const blocked = branchDeletionBlockReason({
        isDefault: Boolean(settings[0]),
        hasEvents: Number(eventCount[0]?.value ?? 0) > 0,
        hasFormSubmissions: Number(submissionCount[0]?.value ?? 0) > 0,
      });
      if (blocked) return { ok: false as const, message: blocked };

      const gallery = await tx
        .select({ imagePath: galleryItems.imagePath })
        .from(galleryItems)
        .where(eq(galleryItems.branchId, branch.id));
      const branchCampaigns = await tx
        .select({ id: campaigns.id, bannerPath: campaigns.bannerPath })
        .from(campaigns)
        .where(eq(campaigns.branchId, branch.id));
      const builderLayouts = await tx
        .select({
          draftBlocks: branchPageBuilderLayouts.draftBlocks,
          publishedBlocks: branchPageBuilderLayouts.publishedBlocks,
        })
        .from(branchPageBuilderLayouts)
        .where(eq(branchPageBuilderLayouts.branchId, branch.id));
      const builderMediaPaths = builderLayouts.flatMap((layout) =>
        [layout.draftBlocks, layout.publishedBlocks].flatMap((blocks) => {
          const parsed = pageBuilderBlocksSchema.safeParse(blocks);
          return parsed.success
            ? parsed.data.flatMap((block) =>
                block.type === "image"
                  ? [ownedMediaPath(block.path, `builder/${branch.id}/`)]
                  : [],
              )
            : [];
        }),
      );

      await tx.delete(pageBlocks).where(eq(pageBlocks.branchId, branch.id));
      await tx
        .delete(branchPageBuilderLayouts)
        .where(eq(branchPageBuilderLayouts.branchId, branch.id));
      await tx
        .delete(branchMetaTrackingConfigs)
        .where(eq(branchMetaTrackingConfigs.branchId, branch.id));
      await tx
        .delete(branchGoogleReviews)
        .where(eq(branchGoogleReviews.branchId, branch.id));
      await tx
        .delete(branchReviewSources)
        .where(eq(branchReviewSources.branchId, branch.id));
      await tx.delete(galleryItems).where(eq(galleryItems.branchId, branch.id));
      await tx.delete(faqs).where(eq(faqs.branchId, branch.id));
      await tx.delete(campaigns).where(eq(campaigns.branchId, branch.id));
      await tx.delete(links).where(eq(links.branchId, branch.id));
      await tx
        .delete(contentSections)
        .where(eq(contentSections.branchId, branch.id));
      await tx
        .delete(productBranches)
        .where(eq(productBranches.branchId, branch.id));
      await tx.insert(auditLogs).values({
        adminId: profile.id,
        action: "delete",
        entityType: "branches",
        entityId: branch.id,
        changes: { slug: branch.slug, mode: "test_page" },
      });
      const [removed] = await tx
        .delete(branches)
        .where(eq(branches.id, branch.id))
        .returning({ id: branches.id });
      if (!removed) throw new Error("Branch was not deleted.");

      const mediaPaths = [
        ownedMediaPath(branch.logoPath, `branches/${branch.id}/`),
        ...gallery.map((item) =>
          ownedMediaPath(item.imagePath, `gallery/${branch.id}/`),
        ),
        ...branchCampaigns.map((campaign) =>
          ownedMediaPath(campaign.bannerPath, `campaigns/${campaign.id}/`),
        ),
        ...builderMediaPaths,
      ].filter((path): path is string => path !== null);
      return {
        ok: true as const,
        slug: branch.slug,
        mediaPaths: [...new Set(mediaPaths)],
        mediaDirectories: [`builder/${branch.id}`],
      };
    });
    if (!deleted.ok) return { message: deleted.message, errors: {} };

    const cleanup = await Promise.allSettled([
      ...deleted.mediaPaths.map((path) => deletePublicAsset(path)),
      ...deleted.mediaDirectories.map((path) => deletePublicAssetTree(path)),
    ]);
    revalidatePath("/");
    revalidatePath(`/${deleted.slug}`);
    revalidatePath("/admin/link-bio");
    return {
      message: cleanup.some((result) => result.status === "rejected")
        ? "Halaman uji dihapus. Sebagian file gambar lama belum dapat dibersihkan."
        : "Halaman uji dan data khusus cabangnya dihapus permanen.",
      errors: {},
      ok: true,
    };
  } catch {
    return {
      message:
        "Halaman belum dapat dihapus. Nonaktifkan halaman bila sudah bukan data uji.",
      errors: {},
    };
  }
}
