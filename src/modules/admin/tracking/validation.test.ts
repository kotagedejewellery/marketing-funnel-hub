import { describe, expect, it } from "vitest";

import { parseTrackingAnalyticsFilters } from "./validation";

describe("tracking analytics filters", () => {
  it("defaults to the 30-day overview without an untrusted filter", () => {
    expect(parseTrackingAnalyticsFilters({})).toMatchObject({
      view: "overview",
      range: "30",
      branchId: null,
      eventName: null,
      page: 1,
    });
  });

  it("falls back safely when any analytics filter is malformed", () => {
    expect(
      parseTrackingAnalyticsFilters({
        view: "events",
        range: "custom",
        start: "2026-09-01",
        end: "2026-09-24",
        branchId: "not-a-uuid",
        eventName: "Contact",
        product: "cincin-nikah",
        page: "2",
      }),
    ).toMatchObject({
      view: "overview",
      range: "30",
      branchId: null,
      eventName: null,
      page: 1,
    });
  });
});
