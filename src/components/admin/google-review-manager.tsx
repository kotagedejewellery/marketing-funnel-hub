"use client";

import { useActionState } from "react";

import { FormFeedback } from "@/components/admin/admin-toast";
import { PageOrderControls } from "@/components/admin/page-order-controls";
import type {
  branchGoogleReviews,
  branchReviewSources,
} from "@/lib/db/schema";
import {
  saveBranchReviewSource,
  saveReviewDisplayState,
  scrapeBranchGoogleReviews,
} from "@/modules/reviews/actions";

type ReviewSource = typeof branchReviewSources.$inferSelect;
type GoogleReview = typeof branchGoogleReviews.$inferSelect;

const inputClass =
  "mt-2 min-h-11 w-full rounded-sm border border-border bg-background px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2";

function formattedDate(value: Date | null) {
  if (!value) return "Belum pernah diambil";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
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
  const [sourceState, sourceAction, sourcePending] = useActionState(
    saveBranchReviewSource,
    { message: "", errors: {} },
  );
  const [scrapeState, scrapeAction, scrapePending] = useActionState(
    scrapeBranchGoogleReviews,
    { message: "", errors: {} },
  );

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
          asli tidak dapat diedit; Anda dapat memfilter, memilih, menyembunyikan,
          dan mengurutkannya untuk halaman ini.
        </p>
      </div>

      <form action={sourceAction} className="mt-6 grid gap-5 border-t border-border pt-6">
        <input type="hidden" name="branchId" value={branchId} />
        <div>
          <label htmlFor="google-maps-url" className="font-medium">
            URL Google Maps cabang
          </label>
          <input
            id="google-maps-url"
            name="sourceUrl"
            type="url"
            defaultValue={source?.sourceUrl ?? ""}
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
              defaultValue={String(source?.minimumRating ?? 4)}
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
              defaultValue={String(source?.maximumReviews ?? 6)}
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
              defaultValue={source?.displayMode ?? "automatic"}
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
            defaultChecked={source?.isEnabled ?? false}
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
              {scrapePending ? "Mengambil review..." : "Ambil review dari Firecrawl"}
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
        <ul className="mt-6 divide-y divide-border border-t border-border">
          {reviews.map((review, index) => (
            <li key={review.id} className="py-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="font-semibold break-words">{review.reviewerName}</p>
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
                <PageOrderControls
                  kind="review"
                  id={review.id}
                  branchId={branchId}
                  index={index}
                  count={reviews.length}
                />
              </div>
              <ReviewDisplayControls branchId={branchId} review={review} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ReviewDisplayControls({
  branchId,
  review,
}: {
  branchId: string;
  review: GoogleReview;
}) {
  const [state, action, pending] = useActionState(saveReviewDisplayState, {
    message: "",
    errors: {},
  });
  return (
    <form action={action} className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
      <input type="hidden" name="id" value={review.id} />
      <input type="hidden" name="branchId" value={branchId} />
      <label className="flex min-h-11 items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          name="isSelected"
          defaultChecked={review.isSelected}
          className="size-4 accent-primary"
        />
        Pilih untuk mode manual
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          name="isHidden"
          defaultChecked={review.isHidden}
          className="size-4 accent-primary"
        />
        Sembunyikan
      </label>
      <button
        type="submit"
        disabled={pending}
        className="min-h-10 rounded-full border border-border px-4 text-sm font-semibold hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Simpan tampilan"}
      </button>
      <FormFeedback state={state} pending={pending} />
    </form>
  );
}

