import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env/server", () => ({
  serverEnv: { FORM_SUBMISSION_ENCRYPTION_KEY: "a".repeat(64) },
}));

import {
  createFormContinuationToken,
  decryptFormValues,
  encryptFormValues,
  hashFormContactForSearch,
  hashFormContinuationToken,
} from "./crypto";

describe("form submission encryption", () => {
  it("round-trips values and rejects a modified payload", () => {
    const encrypted = encryptFormValues({ nama: "KJ", setuju: true });
    expect(decryptFormValues(encrypted)).toEqual({ nama: "KJ", setuju: true });
    const parts = encrypted.split(".");
    parts[3] = `${parts[3]?.startsWith("A") ? "B" : "A"}${parts[3]?.slice(1)}`;
    expect(() => decryptFormValues(parts.join("."))).toThrow();
  });

  it("creates an opaque continuation token whose stored form is a hash", () => {
    const token = createFormContinuationToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(hashFormContinuationToken(token)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashFormContinuationToken(token)).not.toContain(token);
  });

  it("creates a stable non-plaintext lookup hash for a normalized contact", () => {
    const hash = hashFormContactForSearch(" Nadia@KGJ.Test ");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).toBe(hashFormContactForSearch("nadia@kgj.test"));
    expect(hash).not.toContain("nadia");
  });
});
