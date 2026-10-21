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
  encryptedMetaCapiTokenMatches,
  encryptMetaCapiToken,
  isMetaCapiTokenDecryptable,
} from "./branch-meta-config";

describe("branch Meta tracking configuration", () => {
  it("uses the global pixel when a branch inherits configuration", () => {
    expect(browserMetaTrackingConfig(null)).toEqual({
      pixelId: "987654321",
      whatsappCtaMetaEvent: "Contact",
    });
  });

  it("uses Contact for legacy configurations without a CTA selection", () => {
    expect(
      browserMetaTrackingConfig({
        mode: "inherit",
        pixelId: null,
        ctaMetaEvent: null,
      }),
    ).toEqual({ pixelId: "987654321", whatsappCtaMetaEvent: "Contact" });
  });

  it("keeps a branch custom pixel and its selected WhatsApp CTA event", () => {
    expect(
      browserMetaTrackingConfig({
        mode: "custom",
        pixelId: "123456789",
        ctaMetaEvent: "Lead",
      }),
    ).toEqual({ pixelId: "123456789", whatsappCtaMetaEvent: "Lead" });
  });

  it("does not expose a pixel when Meta is disabled for a branch", () => {
    expect(
      browserMetaTrackingConfig({
        mode: "disabled",
        pixelId: null,
        ctaMetaEvent: "Contact",
      }),
    ).toEqual({ pixelId: null, whatsappCtaMetaEvent: null });
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

  it("recognizes a visible credential without re-encrypting it", () => {
    const encrypted = encryptMetaCapiToken("test-token-not-for-network");

    expect(
      encryptedMetaCapiTokenMatches(encrypted, "test-token-not-for-network"),
    ).toBe(true);
    expect(encryptedMetaCapiTokenMatches(encrypted, "another-token")).toBe(
      false,
    );
    expect(encryptedMetaCapiTokenMatches(null, "another-token")).toBe(false);
  });
});
