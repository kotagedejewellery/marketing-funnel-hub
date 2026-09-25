"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { FormFeedback } from "@/components/admin/admin-toast";
import { PageOrderControls } from "@/components/admin/page-order-controls";
import type { branchGoogleReviews, branchReviewSources } from "@/lib/db/schema";
import {
  deleteBranchGoogleReviews,
  saveBranchReviewSource,
  saveReviewDisplayStates,
  scrapeBranchGoogleReviews,
} from "@/modules/reviews/actions";

type ReviewSource = typeof branchReviewSources.$inferSelect;
type GoogleReview = typeof branchGoogleReviews.$inferSelect;

type ReviewSourceValues = {
  sourceUrl: string;
  isEnabled: boolean;
  minimumRating: number;
  maximumReviews: number;
  displayMode: "automatic" | "manual";
};

type ReviewDisplayValues = Record<
  string,
  { isSelected: boolean; isHidden: boolean }
>;

const inputClass =
  "mt-2 min-h-11 w-full rounded-sm border border-border bg-background px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2";

function formattedDate(value: Date | null) {
  if (!value) return "Belum pernah diambil";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function sourceValues(source: ReviewSource | null): ReviewSourceValues {
  return {
    sourceUrl: source?.sourceUrl ?? "",
    isEnabled: source?.isEnabled ?? false,
    minimumRating: source?.minimumRating ?? 4,
    maximumReviews: source?.maximumReviews ?? 6,
    displayMode: source?.displayMode === "manual" ? "manual" : "automatic",
  };
}

function reviewDisplayValues(reviews: GoogleReview[]): ReviewDisplayValues {
  return Object.fromEntries(
    reviews.map((review) => [
      review.id,
      { isSelected: review.isSelected, isHidden: review.isHidden },
    ]),
  );
}

export function GoogleReviewManager({
  branchId,
  source,
  reviews,
  canScrape,
}: {
  branchId: string;
  source: ReviewSource | null;
  reviews: GoogleReview[];
  canScrape: boolean;
}) {
  const router = useRouter();
  const [settings, setSettings] = useState(() => sourceValues(source));
  const [displayValues, setDisplayValues] = useState(() =>
    reviewDisplayValues(reviews),
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sourceState, sourceAction, sourcePending] = useActionState(
    saveBranchReviewSource,
    { message: "", errors: {} },
  );
  const [scrapeState, scrapeAction, scrapePending] = useActionState(
    scrapeBranchGoogleReviews,
    { message: "", errors: {} },
  );
  const [displayState, displayAction, displayPending] = useActionState(
    saveReviewDisplayStates,
    { message: "", errors: {} },
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteBranchGoogleReviews,
    { message: "", errors: {} },
  );

  useEffect(() => {
    if (sourceState.ok || scrapeState.ok || displayState.ok || deleteState.ok) {
      router.refresh();
    }
  }, [deleteState, displayState, router, scrapeState, sourceState]);

  const changes = reviews
    .map((review) => ({
      id: review.id,
      isSelected: displayValues[review.id]?.isSelected ?? review.isSelected,
      isHidden: displayValues[review.id]?.isHidden ?? review.isHidden,
    }))
    .filter(
      (review) =>
        review.isSelected !==
          reviews.find((current) => current.id === review.id)?.isSelected ||
        review.isHidden !==
          reviews.find((current) => current.id === review.id)?.isHidden,
    );
  const allSelected =
    reviews.length > 0 && selectedIds.length === reviews.length;

  function toggleSelectedId(id: string, checked: boolean) {
    setSelectedIds((current) =>
      checked
        ? [...new Set([...current, id])]
        : current.filter((item) => item !== id),
    );
  }

  function updateDisplay(
    id: string,
    key: "isSelected" | "isHidden",
    value: boolean,
  ) {
    setDisplayValues((current) => ({
      ...current,
      [id]: { ...current[id], [key]: value },
    }));
  }

  return (
    <section
      className="rounded-2xl bg-card p-6 sm:p-8"
      aria-labelledby="google-reviews-admin-title"
    >
      <div>
        <h2 id="google-reviews-admin-title" className="font-serif text-2xl">
          Ulasan Google
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Simpan URL Google Maps resmi, lalu ambil review secara manual. Review
          asli tidak dapat diedit; Anda dapat memfilter, memilih,
          menyembunyikan, dan mengurutkannya untuk halaman ini.
        </p>
      </div>

      <form
        action={sourceAction}
        className="mt-6 grid gap-5 border-t border-border pt-6"
      >
        <input type="hidden" name="branchId" value={branchId} />
        <div>
          <label htmlFor="google-maps-url" className="font-medium">
            URL Google Maps cabang
          </label>
          <input
            id="google-maps-url"
            name="sourceUrl"
            type="url"
            value={settings.sourceUrl}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                sourceUrl: event.target.value,
              }))
            }
            placeholder="https://maps.app.goo.gl/..."
            required
            maxLength={2048}
            className={inputClass}
          />
          {sourceState.errors.sourceUrl && (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {sourceState.errors.sourceUrl}
            </p>
          )}
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <label className="font-medium">
            Rating minimum
            <select
              name="minimumRating"
              value={String(settings.minimumRating)}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  minimumRating: Number(event.target.value),
                }))
              }
              className={inputClass}
            >
              {[1, 2, 3, 4, 5].map((rating) => (
                <option key={rating} value={rating}>
                  {rating} bintang ke atas
                </option>
              ))}
            </select>
          </label>
          <label className="font-medium">
            Maksimum tampil
            <select
              name="maximumReviews"
              value={String(settings.maximumReviews)}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  maximumReviews: Number(event.target.value),
                }))
              }
              className={inputClass}
            >
              {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((count) => (
                <option key={count} value={count}>
                  {count} review
                </option>
              ))}
            </select>
          </label>
          <label className="font-medium">
            Pilihan review
            <select
              name="displayMode"
              value={settings.displayMode}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  displayMode: event.target
                    .value as ReviewSourceValues["displayMode"],
                }))
              }
              className={inputClass}
            >
              <option value="automatic">Otomatis sesuai filter</option>
              <option value="manual">Hanya yang dipilih</option>
            </select>
          </label>
        </div>
        <label className="flex min-h-11 items-center gap-3 font-medium">
          <input
            type="checkbox"
            name="isEnabled"
            checked={settings.isEnabled}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                isEnabled: event.target.checked,
              }))
            }
            className="size-5 accent-primary"
          />
          Tampilkan section Ulasan Google bila ada review yang lolos
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={sourcePending}
            className="min-h-11 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-[var(--kgj-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
          >
            {sourcePending ? "Menyimpan..." : "Simpan pengaturan review"}
          </button>
          <FormFeedback state={sourceState} pending={sourcePending} />
        </div>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-secondary px-4 py-4">
        <div className="text-sm text-muted-foreground">
          <p>
            Terakhir diambil: {formattedDate(source?.lastScrapedAt ?? null)}
          </p>
          {source?.lastError && (
            <p role="alert" className="mt-1 text-destructive">
              Pengambilan terakhir: {source.lastError}
            </p>
          )}
        </div>
        {canScrape ? (
          <form action={scrapeAction}>
            <input type="hidden" name="branchId" value={branchId} />
            <button
              type="submit"
              disabled={scrapePending || !source}
              className="min-h-11 rounded-full border border-border bg-card px-5 text-sm font-bold hover:bg-[var(--kgj-accent-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
            >
              {scrapePending
                ? "Mengambil review..."
                : "Ambil review dari Firecrawl"}
            </button>
            <FormFeedback state={scrapeState} pending={scrapePending} />
          </form>
        ) : (
          <p className="text-sm font-medium text-muted-foreground">
            Pengambilan review hanya untuk technical admin.
          </p>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="mt-6 border-t border-border pt-6 text-sm text-muted-foreground">
          Belum ada review yang diambil untuk cabang ini.
        </p>
      ) : (
        <div className="mt-6 border-t border-border pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(event) =>
                  setSelectedIds(
                    event.target.checked
                      ? reviews.map((review) => review.id)
                      : [],
                  )
                }
                className="size-4 accent-primary"
              />
              Pilih semua ({reviews.length})
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <form
                id="review-display-form"
                action={displayAction}
                className="contents"
              >
                <input type="hidden" name="branchId" value={branchId} />
                <input
                  type="hidden"
                  name="reviews"
                  value={JSON.stringify(changes)}
                />
              </form>
              <button
                type="submit"
                form="review-display-form"
                disabled={displayPending || changes.length === 0}
                className="min-h-11 rounded-full border border-border bg-card px-4 text-sm font-semibold hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
              >
                {displayPending
                  ? "Menyimpan..."
                  : `Simpan tampilan${changes.length ? ` (${changes.length})` : ""}`}
              </button>
              <form
                action={deleteAction}
                onSubmit={(event) => {
                  if (
                    !window.confirm(
                      `Hapus permanen ${selectedIds.length} review yang dipilih?`,
                    )
                  ) {
                    event.preventDefault();
                  }
                }}
              >
                <input type="hidden" name="branchId" value={branchId} />
                <input
                  type="hidden"
                  name="ids"
                  value={JSON.stringify(selectedIds)}
                />
                <button
                  type="submit"
                  disabled={deletePending || selectedIds.length === 0}
                  className="min-h-11 rounded-full border border-destructive/40 px-4 text-sm font-semibold text-destructive hover:bg-destructive/10 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
                >
                  {deletePending
                    ? "Menghapus..."
                    : `Hapus terpilih${selectedIds.length ? ` (${selectedIds.length})` : ""}`}
                </button>
              </form>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            <FormFeedback state={displayState} pending={displayPending} />
            <FormFeedback state={deleteState} pending={deletePending} />
          </div>
          <ul className="mt-4 divide-y divide-border">
            {reviews.map((review, index) => {
              const display = displayValues[review.id] ?? {
                isSelected: review.isSelected,
                isHidden: review.isHidden,
              };
              return (
                <li key={review.id} className="py-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(review.id)}
                        onChange={(event) =>
                          toggleSelectedId(review.id, event.target.checked)
                        }
                        aria-label={`Pilih review ${review.reviewerName}`}
                        className="mt-1 size-4 shrink-0 accent-primary"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <p className="font-semibold break-words">
                            {review.reviewerName}
                          </p>
                          <span className="text-sm text-amber-600">
                            {"★".repeat(review.rating)} {review.rating}/5
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {review.relativeTime}
                          </span>
                        </div>
                        {review.reviewerReviewCount !== null && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {review.reviewerReviewCount} ulasan dari reviewer
                          </p>
                        )}
                        <p className="mt-2 line-clamp-4 text-sm leading-6 whitespace-pre-line text-muted-foreground">
                          {review.reviewText}
                        </p>
                      </div>
                    </div>
                    <PageOrderControls
                      kind="review"
                      id={review.id}
                      branchId={branchId}
                      index={index}
                      count={reviews.length}
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 pl-7">
                    <label className="flex min-h-11 items-center gap-2 text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={display.isSelected}
                        onChange={(event) =>
                          updateDisplay(
                            review.id,
                            "isSelected",
                            event.target.checked,
                          )
                        }
                        className="size-4 accent-primary"
                      />
                      Pilih untuk mode manual
                    </label>
                    <label className="flex min-h-11 items-center gap-2 text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={display.isHidden}
                        onChange={(event) =>
                          updateDisplay(
                            review.id,
                            "isHidden",
                            event.target.checked,
                          )
                        }
                        className="size-4 accent-primary"
                      />
                      Sembunyikan
                    </label>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
