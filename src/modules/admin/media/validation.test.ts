import { describe, expect, it } from "vitest";

import {
  imageExtension,
  mediaOverrideTargetSchema,
  mediaTargetSchema,
} from "./validation";

describe("media target validation", () => {
  it("accepts only the fixed site settings ID for logo uploads", () => {
    expect(
      mediaTargetSchema.safeParse({
        entityType: "site",
        entityId: "00000000-0000-0000-0000-000000000001",
      }).success,
    ).toBe(true);
    expect(
      mediaTargetSchema.safeParse({
        entityType: "site",
        entityId: "11111111-1111-4111-8111-111111111111",
      }).success,
    ).toBe(false);
  });

  it("allows only branch logo overrides to be cleared", () => {
    const entityId = "11111111-1111-4111-8111-111111111111";

    expect(
      mediaOverrideTargetSchema.safeParse({ entityType: "branch", entityId })
        .success,
    ).toBe(true);
    expect(
      mediaOverrideTargetSchema.safeParse({
        entityType: "assignment",
        entityId,
      }).success,
    ).toBe(false);
    expect(
      mediaOverrideTargetSchema.safeParse({ entityType: "site", entityId })
        .success,
    ).toBe(false);
    expect(
      mediaOverrideTargetSchema.safeParse({ entityType: "product", entityId })
        .success,
    ).toBe(false);
  });
});

describe("media signature validation", () => {
  it("accepts supported signatures only when the MIME type matches", () => {
    const png = Uint8Array.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
    expect(imageExtension("image/png", png)).toBe("png");
    expect(imageExtension("image/jpeg", png)).toBeNull();
    expect(imageExtension("image/svg+xml", png)).toBeNull();
  });
});
