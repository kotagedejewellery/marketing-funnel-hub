import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { isGoogleSheetsDeliveryRetryable } from "./delivery-state";

describe("Google Sheets delivery retry state", () => {
  it("does not expose retry while an active delivery is still within its lease", () => {
    const now = new Date("2026-11-23T03:00:00.000Z");
    expect(isGoogleSheetsDeliveryRetryable("delivering", now, now)).toBe(false);
    expect(
      isGoogleSheetsDeliveryRetryable(
        "delivering",
        new Date("2026-11-23T02:57:59.999Z"),
        now,
      ),
    ).toBe(true);
  });
});
