import { describe, expect, it } from "vitest";

import { getPageSourceSummary } from "./page-source-summary";

describe("getPageSourceSummary", () => {
  it("reports only content that is eligible for public rendering", () => {
    const summary = getPageSourceSummary({
      now: new Date("2026-11-17T00:00:00.000Z"),
      branchIsActive: true,
      logoPath: null,
      campaigns: [
        {
          isActive: true,
          activeFrom: new Date("2026-11-01"),
          activeUntil: null,
        },
        {
          isActive: true,
          activeFrom: new Date("2026-12-01"),
          activeUntil: null,
        },
      ],
      gallery: [{ isActive: true }],
      activeCtaCount: 2,
      reviewSource: {
        isEnabled: true,
        minimumRating: 4,
        maximumReviews: 6,
        displayMode: "manual",
      },
      reviews: [
        {
          isHidden: false,
          isSelected: true,
          rating: 5,
          relativeTimeId: "2 hari lalu",
          reviewTextId: "Bagus",
        },
        {
          isHidden: false,
          isSelected: false,
          rating: 5,
          relativeTimeId: "3 hari lalu",
          reviewTextId: "Bagus sekali",
        },
      ],
      faqs: [{ isActive: true }],
      inheritsFaqs: true,
      activeLinkCount: 1,
      activeSectionCount: 4,
    });

    expect(summary).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "campaign", detail: "1 siap tampil" }),
        expect.objectContaining({ id: "reviews", detail: "1 siap tampil" }),
        expect.objectContaining({ id: "faq", detail: "1 aktif · template" }),
      ]),
    );
  });
});
