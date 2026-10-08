import { describe, expect, it } from "vitest";

import { sectionActionSchema, settingsSchema } from "./validation";

describe("admin content input", () => {
  it("accepts a settings message with supported WhatsApp variables", () => {
    const result = settingsSchema.safeParse({
      siteName: "KGJ",
      showProfileName: "on",
      showHeadline: "on",
      headline: "Cincin pilihan",
      introduction: "",
      privacyUrl: "",
      defaultWhatsappMessage: "Halo, saya tertarik {product} di {branch}.",
      defaultCtaLabel: "Hubungi kami",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.privacyUrl).toBeNull();
      expect(result.data.defaultLinkBioBranchId).toBeNull();
      expect(result.data.showProfileName).toBe(true);
      expect(result.data.showHeadline).toBe(true);
      expect(result.data.showIntroduction).toBe(false);
    }
  });

  it("accepts an active-page selection and normalizes an empty selection", () => {
    const selected = settingsSchema.safeParse({
      siteName: "KGJ",
      headline: "Cincin pilihan",
      introduction: "",
      privacyUrl: "",
      defaultLinkBioBranchId: "a8e65e40-7a0a-4b5e-9f57-0a23c2f9c013",
      defaultWhatsappMessage: "Halo, saya tertarik {product} di {branch}.",
      defaultCtaLabel: "Hubungi kami",
    });

    expect(selected.success).toBe(true);
    if (selected.success) {
      expect(selected.data.defaultLinkBioBranchId).toBe(
        "a8e65e40-7a0a-4b5e-9f57-0a23c2f9c013",
      );
    }
  });

  it("rejects unsupported message variables and invalid section IDs", () => {
    expect(
      settingsSchema.safeParse({
        siteName: "KGJ",
        headline: "",
        introduction: "",
        privacyUrl: "",
        defaultWhatsappMessage: "Halo {customer}",
        defaultCtaLabel: "Hubungi kami",
      }).success,
    ).toBe(false);
    expect(
      sectionActionSchema.safeParse({ id: "not-a-uuid", operation: "up" })
        .success,
    ).toBe(false);
  });
});
