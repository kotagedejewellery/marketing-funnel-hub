import { describe, expect, it } from "vitest";

import { sectionActionSchema, settingsSchema } from "./validation";

describe("admin content input", () => {
  it("accepts a settings message with supported WhatsApp variables", () => {
    const result = settingsSchema.safeParse({
      siteName: "KGJ",
      headline: "Cincin pilihan",
      introduction: "",
      privacyUrl: "",
      defaultWhatsappMessage: "Halo, saya tertarik {product} di {branch}.",
      defaultCtaLabel: "Hubungi kami",
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.privacyUrl).toBeNull();
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
