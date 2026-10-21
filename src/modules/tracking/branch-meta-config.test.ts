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
  pageLoadMetaEventForConfig,
} from "./branch-meta-config";

describe("branch Meta tracking configuration", () => {
  it("uses the global pixel when a branch inherits configuration", () => {
    expect(browserMetaTrackingConfig(null)).toEqual({
      pixelId: "987654321",
      pageLoadMetaEvent: "PageView",
    });
  });

  it("preserves an explicit no-page-load-event choice", () => {
    expect(pageLoadMetaEventForConfig(null)).toBe("PageView");
    expect(pageLoadMetaEventForConfig({ pageLoadMetaEvent: null })).toBeNull();
  });

  it("allows a branch to stop only the Meta page-load event while retaining the global pixel", () => {
    expect(
      browserMetaTrackingConfig({
        mode: "inherit",
        pixelId: null,
        pageLoadMetaEvent: null,
      }),
    ).toEqual({ pixelId: "987654321", pageLoadMetaEvent: null });
  });

  it("keeps a branch custom pixel and its selected page-load event", () => {
    expect(
      browserMetaTrackingConfig({
        mode: "custom",
        pixelId: "123456789",
        pageLoadMetaEvent: "ViewContent",
      }),
    ).toEqual({ pixelId: "123456789", pageLoadMetaEvent: "ViewContent" });
  });

  it("does not expose a pixel when Meta is disabled for a branch", () => {
    expect(
      browserMetaTrackingConfig({
        mode: "disabled",
        pixelId: null,
        pageLoadMetaEvent: "PageView",
      }),
    ).toEqual({ pixelId: null, pageLoadMetaEvent: null });
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
