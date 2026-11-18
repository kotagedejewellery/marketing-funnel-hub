import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env/server", () => ({
  serverEnv: { FORM_SUBMISSION_ENCRYPTION_KEY: "a".repeat(64) },
}));

import { decryptFormValues, encryptFormValues } from "./crypto";

describe("form submission encryption", () => {
  it("round-trips values and rejects a modified payload", () => {
    const encrypted = encryptFormValues({ nama: "KJ", setuju: true });
    expect(decryptFormValues(encrypted)).toEqual({ nama: "KJ", setuju: true });
    const parts = encrypted.split(".");
    parts[3] = `${parts[3]?.startsWith("A") ? "B" : "A"}${parts[3]?.slice(1)}`;
    expect(() => decryptFormValues(parts.join("."))).toThrow();
  });
});
