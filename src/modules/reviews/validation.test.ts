import { describe, expect, it } from "vitest";

import {
  isGoogleMapsUrl,
  extractedGoogleReviewsSchema,
  reviewDeleteSchema,
  reviewDisplayBatchSchema,
  reviewSourceSchema,
} from "./validation";

describe("Google Maps review source", () => {
  it("accepts official Google Maps URLs and rejects unrelated URLs", () => {
    expect(isGoogleMapsUrl("https://maps.app.goo.gl/example")).toBe(true);
    expect(isGoogleMapsUrl("https://www.google.com/maps/place/KGJ")).toBe(true);
    expect(
      isGoogleMapsUrl("https://www.google.com/search?q=KGJ#lrd=example"),
    ).toBe(true);
    expect(isGoogleMapsUrl("https://example.com/maps/place/KGJ")).toBe(false);
    expect(isGoogleMapsUrl("http://maps.google.com/maps/place/KGJ")).toBe(
      false,
    );
  });

  it("validates bounded batch display changes and permanent deletions", () => {
    const id = "00000000-0000-4000-8000-000000000002";
    const branchId = "00000000-0000-4000-8000-000000000001";
    const display = reviewDisplayBatchSchema.safeParse({
      branchId,
      reviews: JSON.stringify([{ id, isSelected: true, isHidden: false }]),
    });
    const deletion = reviewDeleteSchema.safeParse({
      branchId,
      ids: JSON.stringify([id]),
    });

    expect(display.success).toBe(true);
    expect(deletion.success).toBe(true);
  });

  it("requires Indonesian display text and relative time from Firecrawl", () => {
    const review = {
      reviewerName: "Maria Prasasti",
      reviewerPhotoUrl: null,
      reviewerReviewCount: 1,
      rating: 5,
      relativeTime: "6 months ago",
      relativeTimeId: "6 bulan lalu",
      reviewText: "Wonderful service.",
      reviewTextId: "Pelayanannya luar biasa.",
      reviewedAt: "2026-01-15",
    };

    expect(
      extractedGoogleReviewsSchema.safeParse({ reviews: [review] }).success,
    ).toBe(true);
    expect(
      extractedGoogleReviewsSchema.safeParse({
        reviews: [{ ...review, reviewTextId: undefined }],
      }).success,
    ).toBe(false);
    expect(
      extractedGoogleReviewsSchema.safeParse({
        reviews: [{ ...review, reviewedAt: "6 months ago" }],
      }).success,
    ).toBe(false);
  });

  it("validates the per-branch display controls", () => {
    const result = reviewSourceSchema.safeParse({
      branchId: "00000000-0000-4000-8000-000000000001",
      sourceUrl: "https://maps.app.goo.gl/example",
      isEnabled: true,
      minimumRating: "4",
      maximumReviews: "6",
      displayMode: "manual",
      scrapeYear: "2026",
      scrapeLimit: "50",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.minimumRating).toBe(4);
      expect(result.data.maximumReviews).toBe(6);
      expect(result.data.scrapeYear).toBe(2026);
      expect(result.data.scrapeLimit).toBe(50);
    }
  });

  it("accepts an all-years import and rejects unsupported import limits", () => {
    const base = {
      branchId: "00000000-0000-4000-8000-000000000001",
      sourceUrl: "https://maps.app.goo.gl/example",
      isEnabled: true,
      minimumRating: "4",
      maximumReviews: "6",
      displayMode: "automatic",
      scrapeYear: "",
      scrapeLimit: "25",
    };

    expect(reviewSourceSchema.safeParse(base).success).toBe(true);
    expect(
      reviewSourceSchema.safeParse({ ...base, scrapeLimit: "100" }).success,
    ).toBe(false);
  });
});
