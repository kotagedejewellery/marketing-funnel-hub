import { afterEach, describe, expect, it } from "vitest";

import { isAllowedPublicUrl } from "./url-validation";

const originalAppEnv = process.env.NEXT_PUBLIC_APP_ENV;

afterEach(() => {
  process.env.NEXT_PUBLIC_APP_ENV = originalAppEnv;
});

describe("public URL validation", () => {
  it("requires HTTPS except localhost HTTP in local development", () => {
    process.env.NEXT_PUBLIC_APP_ENV = "production";
    expect(isAllowedPublicUrl("https://example.com/path")).toBe(true);
    expect(isAllowedPublicUrl("http://example.com/path")).toBe(false);
    expect(isAllowedPublicUrl("https://user:pass@example.com")).toBe(false);

    process.env.NEXT_PUBLIC_APP_ENV = "local";
    expect(isAllowedPublicUrl("http://127.0.0.1:3000/path")).toBe(true);
    expect(isAllowedPublicUrl("http://example.com/path")).toBe(false);
  });
});
