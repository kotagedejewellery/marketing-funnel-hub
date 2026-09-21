import { describe, expect, it } from "vitest";

import { campaignSchema, parseWibDate, toWibInput } from "./validation";

describe("campaign WIB schedule", () => {
  it("converts a valid WIB time to UTC and back", () => {
    const date = parseWibDate("2026-09-18T14:30");
    expect(date?.toISOString()).toBe("2026-09-18T07:30:00.000Z");
    expect(toWibInput(date)).toBe("2026-09-18T14:30");
    expect(parseWibDate("2026-02-30T14:30")).toBeNull();
  });

  it("rejects an end time that is not after the start", () => {
    expect(
      campaignSchema.safeParse({
        id: "",
        name: "Promo",
        title: "",
        description: "",
        targetUrl: "",
        activeFrom: "2026-09-18T14:30",
        activeUntil: "2026-09-18T14:30",
        isActive: true,
        sortOrder: "0",
      }).success,
    ).toBe(false);
  });
});
