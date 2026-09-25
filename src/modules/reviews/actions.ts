"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDatabase } from "@/lib/db/client";
import {
  auditLogs,
  branches,
  branchGoogleReviews,
  branchReviewSources,
} from "@/lib/db/schema";
import { requireAdmin, requireTechnicalAdmin } from "@/modules/admin/access";

import {
  FirecrawlReviewError,
  googleReviewerPhotoUrl,
  reviewSourceHash,
  scrapeGoogleMapsReviews,
} from "./firecrawl";
import {
  branchReviewSchema,
  reviewDeleteSchema,
  reviewDisplayBatchSchema,
  reviewSourceSchema,
} from "./validation";

type ActionState = {
  message: string;
  errors: Record<string, string>;
  ok?: boolean;
  source?: {
    sourceUrl: string;
    isEnabled: boolean;
    minimumRating: number;
    maximumReviews: number;
    displayMode: "automatic" | "manual";
  };
};

async function branchSlug(branchId: string) {
  const [branch] = await getDatabase()
    .select({ slug: branches.slug })
    .from(branches)
    .where(eq(branches.id, branchId))
    .limit(1);
  return branch?.slug ?? null;
}

function revalidateReviewPages(branchId: string, slug: string) {
  revalidatePath(`/${slug}`);
  revalidatePath(`/admin/branches/${branchId}/link-bio`);
}

export async function saveBranchReviewSource(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireAdmin();
  const parsed = reviewSourceSchema.safeParse({
    branchId: formData.get("branchId"),
    sourceUrl: formData.get("sourceUrl"),
    isEnabled: formData.get("isEnabled") === "on",
    minimumRating: formData.get("minimumRating"),
    maximumReviews: formData.get("maximumReviews"),
    displayMode: formData.get("displayMode"),
  });
  if (!parsed.success) {
    return {
      message: "Periksa pengaturan review Google.",
      errors: Object.fromEntries(
        parsed.error.issues.map((issue) => [
          String(issue.path[0]),
          issue.message,
        ]),
      ),
    };
  }

  const input = parsed.data;
  const slug = await branchSlug(input.branchId);
  if (!slug) return { message: "Cabang tidak ditemukan.", errors: {} };

  try {
    await getDatabase().transaction(async (tx) => {
      const [current] = await tx
        .select({ id: branchReviewSources.id })
        .from(branchReviewSources)
        .where(eq(branchReviewSources.branchId, input.branchId))
        .limit(1);
      const values = {
        sourceUrl: input.sourceUrl,
        isEnabled: input.isEnabled,
        minimumRating: input.minimumRating,
        maximumReviews: input.maximumReviews,
        displayMode: input.displayMode,
        updatedAt: new Date(),
      };
      const id =
        current?.id ??
        (
          await tx
            .insert(branchReviewSources)
            .values({ branchId: input.branchId, ...values })
            .returning({ id: branchReviewSources.id })
        )[0]?.id;
      if (current) {
        await tx
          .update(branchReviewSources)
          .set(values)
          .where(eq(branchReviewSources.id, current.id));
      }
      if (!id) throw new Error("Review source was not saved.");
      await tx.insert(auditLogs).values({
        adminId: profile.id,
        action: current ? "update" : "create",
        entityType: "branch_review_sources",
        entityId: id,
        changes: {
          branchId: input.branchId,
          fields: [
            "sourceUrl",
            "isEnabled",
            "minimumRating",
            "maximumReviews",
            "displayMode",
          ],
        },
      });
    });
  } catch {
    return { message: "Pengaturan review belum tersimpan.", errors: {} };
  }

  revalidateReviewPages(input.branchId, slug);
  return {
    message: "Pengaturan review tersimpan.",
    errors: {},
    ok: true,
    source: {
      sourceUrl: input.sourceUrl,
      isEnabled: input.isEnabled,
      minimumRating: input.minimumRating,
      maximumReviews: input.maximumReviews,
      displayMode: input.displayMode,
    },
  };
}

export async function scrapeBranchGoogleReviews(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireTechnicalAdmin();
  const parsed = branchReviewSchema.safeParse({
    branchId: formData.get("branchId"),
  });
  if (!parsed.success) return { message: "Cabang tidak valid.", errors: {} };

  const { branchId } = parsed.data;
  const [branch, source] = await Promise.all([
    branchSlug(branchId),
    getDatabase()
      .select()
      .from(branchReviewSources)
      .where(eq(branchReviewSources.branchId, branchId))
      .limit(1)
      .then(([row]) => row ?? null),
  ]);
  if (!branch) return { message: "Cabang tidak ditemukan.", errors: {} };
  if (!source) {
    return {
      message: "Simpan URL Google Maps sebelum mengambil review.",
      errors: {},
    };
  }

  let scraped;
  try {
    scraped = await scrapeGoogleMapsReviews(source.sourceUrl);
  } catch (error) {
    const message =
      error instanceof FirecrawlReviewError
        ? error.message
        : "Pengambilan review gagal. Coba lagi.";
    await getDatabase()
      .update(branchReviewSources)
      .set({ lastError: message, updatedAt: new Date() })
      .where(eq(branchReviewSources.id, source.id));
    return { message, errors: {} };
  }

  const uniqueReviews = Array.from(
    new Map(
      scraped.map((review) => [reviewSourceHash(review), review]),
    ).entries(),
  );
  try {
    await getDatabase().transaction(async (tx) => {
      const existing = await tx
        .select({
          id: branchGoogleReviews.id,
          sourceHash: branchGoogleReviews.sourceHash,
          sortOrder: branchGoogleReviews.sortOrder,
        })
        .from(branchGoogleReviews)
        .where(eq(branchGoogleReviews.branchId, branchId));
      const existingByHash = new Map(
        existing.map((review) => [review.sourceHash, review]),
      );
      let nextSortOrder =
        existing.reduce(
          (maximum, review) => Math.max(maximum, review.sortOrder),
          -1,
        ) + 1;
      const fetchedAt = new Date();

      for (const [sourceHash, review] of uniqueReviews) {
        const values = {
          reviewerName: review.reviewerName,
          reviewerPhotoUrl: googleReviewerPhotoUrl(review.reviewerPhotoUrl),
          reviewerReviewCount: review.reviewerReviewCount ?? null,
          rating: review.rating,
          relativeTime: review.relativeTime,
          relativeTimeId: review.relativeTimeId,
          reviewText: review.reviewText,
          reviewTextId: review.reviewTextId,
          sourceUrl: source.sourceUrl,
          fetchedAt,
          updatedAt: fetchedAt,
        };
        const current = existingByHash.get(sourceHash);
        if (current) {
          await tx
            .update(branchGoogleReviews)
            .set(values)
            .where(eq(branchGoogleReviews.id, current.id));
        } else {
          await tx.insert(branchGoogleReviews).values({
            branchId,
            sourceHash,
            sortOrder: nextSortOrder++,
            ...values,
          });
        }
      }
      await tx
        .update(branchReviewSources)
        .set({
          lastScrapedAt: fetchedAt,
          lastError: null,
          updatedAt: fetchedAt,
        })
        .where(eq(branchReviewSources.id, source.id));
      await tx.insert(auditLogs).values({
        adminId: profile.id,
        action: "import",
        entityType: "branch_google_reviews",
        entityId: source.id,
        changes: { branchId, importedCount: uniqueReviews.length },
      });
    });
  } catch {
    return {
      message: "Review berhasil diambil, tetapi belum tersimpan.",
      errors: {},
    };
  }

  revalidateReviewPages(branchId, branch);
  return {
    message: `${uniqueReviews.length} review berhasil diambil dari Firecrawl.`,
    errors: {},
    ok: true,
  };
}

export async function saveReviewDisplayStates(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireAdmin();
  const parsed = reviewDisplayBatchSchema.safeParse({
    branchId: formData.get("branchId"),
    reviews: formData.get("reviews"),
  });
  if (!parsed.success)
    return { message: "Perubahan review tidak valid.", errors: {} };

  const input = parsed.data;
  const slug = await branchSlug(input.branchId);
  if (!slug) return { message: "Cabang tidak ditemukan.", errors: {} };

  try {
    const changed = await getDatabase().transaction(async (tx) => {
      const current = await tx
        .select({
          id: branchGoogleReviews.id,
          isSelected: branchGoogleReviews.isSelected,
          isHidden: branchGoogleReviews.isHidden,
        })
        .from(branchGoogleReviews)
        .where(
          and(
            eq(branchGoogleReviews.branchId, input.branchId),
            inArray(
              branchGoogleReviews.id,
              input.reviews.map((review) => review.id),
            ),
          ),
        );
      if (current.length !== input.reviews.length) throw new Error("Not found");

      const currentById = new Map(current.map((review) => [review.id, review]));
      const changedReviews = input.reviews.filter((review) => {
        const saved = currentById.get(review.id);
        return (
          saved &&
          (saved.isSelected !== review.isSelected ||
            saved.isHidden !== review.isHidden)
        );
      });
      for (const review of changedReviews) {
        await tx
          .update(branchGoogleReviews)
          .set({
            isSelected: review.isSelected,
            isHidden: review.isHidden,
            updatedAt: new Date(),
          })
          .where(eq(branchGoogleReviews.id, review.id));
      }
      if (changedReviews.length) {
        await tx.insert(auditLogs).values({
          adminId: profile.id,
          action: "update",
          entityType: "branch_google_reviews",
          changes: {
            branchId: input.branchId,
            updatedCount: changedReviews.length,
            fields: ["isSelected", "isHidden"],
          },
        });
      }
      return changedReviews.length;
    });
    if (changed === 0)
      return { message: "Tidak ada perubahan tampilan review.", errors: {} };
  } catch {
    return { message: "Tampilan review belum tersimpan.", errors: {} };
  }

  revalidateReviewPages(input.branchId, slug);
  return { message: "Tampilan review diperbarui.", errors: {}, ok: true };
}

export async function deleteBranchGoogleReviews(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireAdmin();
  const parsed = reviewDeleteSchema.safeParse({
    branchId: formData.get("branchId"),
    ids: formData.get("ids"),
  });
  if (!parsed.success)
    return { message: "Review yang dipilih tidak valid.", errors: {} };

  const input = parsed.data;
  const slug = await branchSlug(input.branchId);
  if (!slug) return { message: "Cabang tidak ditemukan.", errors: {} };

  try {
    await getDatabase().transaction(async (tx) => {
      const selected = await tx
        .select({ id: branchGoogleReviews.id })
        .from(branchGoogleReviews)
        .where(
          and(
            eq(branchGoogleReviews.branchId, input.branchId),
            inArray(branchGoogleReviews.id, input.ids),
          ),
        );
      if (selected.length !== input.ids.length) throw new Error("Not found");
      await tx
        .delete(branchGoogleReviews)
        .where(
          and(
            eq(branchGoogleReviews.branchId, input.branchId),
            inArray(branchGoogleReviews.id, input.ids),
          ),
        );
      await tx.insert(auditLogs).values({
        adminId: profile.id,
        action: "delete",
        entityType: "branch_google_reviews",
        changes: { branchId: input.branchId, deletedCount: selected.length },
      });
    });
  } catch {
    return { message: "Review belum dapat dihapus.", errors: {} };
  }

  revalidateReviewPages(input.branchId, slug);
  return {
    message: `${input.ids.length} review dihapus permanen.`,
    errors: {},
    ok: true,
  };
}
