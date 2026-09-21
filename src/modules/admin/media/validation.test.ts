import { describe, expect, it } from "vitest";

import { imageExtension } from "./validation";

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
