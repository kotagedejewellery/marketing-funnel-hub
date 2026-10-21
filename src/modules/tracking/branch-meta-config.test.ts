import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/client", () => ({ getDatabase: vi.fn() }));
vi.mock("@/lib/env/server", () => ({
  serverEnv: {
    NEXT_PUBLIC_META_PIXEL_ID: "987654321",
    META_TRACKING_CONFIG_ENCRYPTION_KEY: "a".repeat(64),
  },
}));

import {
  browserMetaTrackingConfig,
  encryptMetaCapiToken,
  isMetaCapiTokenDecryptable,
} from "./branch-meta-config";

describe("branch Meta tracking configuration", () => {
  it("uses the global pixel when a branch inherits configuration", () => {
    expect(browserMetaTrackingConfig(null)).toEqual({
      pixelId: "987654321",
      pageViewEnabled: true,
    });
  });

  it("allows a branch to stop only PageView while retaining the global pixel", () => {
    expect(
      browserMetaTrackingConfig({
        mode: "inherit",
        pixelId: null,
        pageViewEnabled: false,
      }),
    ).toEqual({ pixelId: "987654321", pageViewEnabled: false });
  });

  it("keeps a branch custom pixel and its PageView preference", () => {
    expect(
      browserMetaTrackingConfig({
        mode: "custom",
        pixelId: "123456789",
        pageViewEnabled: false,
      }),
    ).toEqual({ pixelId: "123456789", pageViewEnabled: false });
  });

  it("does not expose a pixel when Meta is disabled for a branch", () => {
    expect(
      browserMetaTrackingConfig({
        mode: "disabled",
        pixelId: null,
        pageViewEnabled: true,
      }),
    ).toEqual({ pixelId: null, pageViewEnabled: false });
  });

  it("detects whether a stored CAPI token can still be decrypted", () => {
    const encrypted = encryptMetaCapiToken("test-token-not-for-network");
    const [version = "", iv = "", authTag = "", ciphertext = ""] =
      encrypted.split(".");
    const tampered = [
      version,
      iv,
      `${authTag.startsWith("A") ? "B" : "A"}${authTag.slice(1)}`,
      ciphertext,
    ].join(".");

    expect(isMetaCapiTokenDecryptable(encrypted)).toBe(true);
    expect(isMetaCapiTokenDecryptable(tampered)).toBe(false);
    expect(isMetaCapiTokenDecryptable(null)).toBe(false);
  });
});
