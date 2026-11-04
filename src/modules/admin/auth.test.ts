import { scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env/server", () => ({
  serverEnv: {
    ADMIN_SESSION_SECRET: "test-admin-session-secret-at-least-32-characters",
    NEXT_PUBLIC_APP_ENV: "local",
  },
}));

import { hashAdminPassword, verifyAdminPassword } from "./auth";

const scrypt = promisify(scryptCallback) as (
  password: string | Buffer,
  salt: string | Buffer,
  keyLength: number,
) => Promise<Buffer>;

describe("internal admin passwords", () => {
  it("verifies only the password used to create the scrypt hash", async () => {
    const hash = await hashAdminPassword("a-safe-admin-password");

    await expect(
      verifyAdminPassword("a-safe-admin-password", hash),
    ).resolves.toBe(true);
    await expect(verifyAdminPassword("wrong-password", hash)).resolves.toBe(
      false,
    );
  });

  it("rejects malformed persisted hashes", async () => {
    await expect(verifyAdminPassword("any-password", "invalid")).resolves.toBe(
      false,
    );
  });

  it("accepts the base64url scrypt format used by the owner bootstrap", async () => {
    const password = "a-safe-admin-password";
    const salt = Buffer.from("0123456789abcdef");
    const hash = Buffer.from(await scrypt(password, salt, 64));
    const bootstrapHash = `scrypt-v1$${salt.toString("base64url")}$${hash.toString("base64url")}`;

    await expect(verifyAdminPassword(password, bootstrapHash)).resolves.toBe(
      true,
    );
  });
});
