import { describe, expect, it } from "vitest";

import { reviewSourceSchema, isGoogleMapsUrl } from "./validation";

describe("Google Maps review source", () => {
  it("accepts official Google Maps URLs and rejects unrelated URLs", () => {
    expect(isGoogleMapsUrl("https://maps.app.goo.gl/example")).toBe(true);
    expect(isGoogleMapsUrl("https://www.google.com/maps/place/KGJ")).toBe(
      true,
    );
    expect(
      isGoogleMapsUrl("https://www.google.com/search?q=KGJ#lrd=example"),
    ).toBe(true);
    expect(isGoogleMapsUrl("https://example.com/maps/place/KGJ")).toBe(false);
    expect(isGoogleMapsUrl("http://maps.google.com/maps/place/KGJ")).toBe(
      false,
    );
  });

  it("validates the per-branch display controls", () => {
    const result = reviewSourceSchema.safeParse({
      branchId: "00000000-0000-4000-8000-000000000001",
      sourceUrl: "https://maps.app.goo.gl/example",
      isEnabled: true,
      minimumRating: "4",
      maximumReviews: "6",
      displayMode: "manual",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.minimumRating).toBe(4);
      expect(result.data.maximumReviews).toBe(6);
    }
  });
});
