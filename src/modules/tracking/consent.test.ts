import { describe, expect, it } from "vitest";

import { encodeConsentCookie, parseConsentCookie } from "./consent";

describe("consent cookie", () => {
  it("round-trips explicit choices and denies absent or invalid values", () => {
    expect(
      parseConsentCookie(
        encodeConsentCookie({ analytics: true, marketing: false }),
      ),
    ).toEqual({ analytics: true, marketing: false });
    expect(parseConsentCookie(undefined)).toBeNull();
    expect(parseConsentCookie("v1.a1.maybe")).toBeNull();
  });
});
