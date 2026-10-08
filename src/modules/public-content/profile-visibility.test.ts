import { describe, expect, it } from "vitest";

import { resolveProfileVisibility } from "./profile-visibility";

describe("resolveProfileVisibility", () => {
  it("uses the template until a branch explicitly overrides it", () => {
    expect(resolveProfileVisibility(null, true)).toBe(true);
    expect(resolveProfileVisibility(null, false)).toBe(false);
    expect(resolveProfileVisibility(true, false)).toBe(true);
    expect(resolveProfileVisibility(false, true)).toBe(false);
  });
});
