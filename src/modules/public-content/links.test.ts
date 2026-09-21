import { describe, expect, it } from "vitest";

import {
  publicAssetUrl,
  publicHref,
  resolveWhatsappCta,
  whatsappHref,
} from "./links";

describe("public destinations", () => {
  it("uses assignment, branch, then site CTA fallbacks", () => {
    const base = {
      number: "628123456789",
      product: "Cincin",
      branch: "Surabaya",
      assignmentLabel: null,
      branchLabel: "Hubungi Surabaya",
      defaultLabel: "Hubungi kami",
      assignmentMessage: null,
      defaultMessage: "Halo {product} di {branch}",
    };
    expect(resolveWhatsappCta(base)).toMatchObject({
      ctaLabel: "Hubungi Surabaya",
      message: "Halo Cincin di Surabaya",
      whatsappUrl:
        "https://wa.me/628123456789?text=Halo%20Cincin%20di%20Surabaya",
    });
    expect(
      resolveWhatsappCta({
        ...base,
        assignmentLabel: "Tanya sekarang",
        assignmentMessage: "Mau {product}",
      }),
    ).toMatchObject({
      ctaLabel: "Tanya sekarang",
      message: "Mau Cincin",
    });
    expect(resolveWhatsappCta({ ...base, branchLabel: null }).ctaLabel).toBe(
      "Hubungi kami",
    );
  });
  it("uses the assignment message before the site default", () => {
    expect(
      whatsappHref(
        "628123456789",
        "Halo {product} di {branch}",
        "Cincin",
        "Solo",
      ),
    ).toBe("https://wa.me/628123456789?text=Halo%20Cincin%20di%20Solo");
  });

  it("rejects script and non-HTTPS external destinations", () => {
    expect(publicHref("javascript:alert(1)")).toBeNull();
    expect(publicHref("http://example.com")).toBeNull();
    expect(publicHref("https://name:secret@example.com")).toBeNull();
    expect(publicHref("https://example.com/catalog")).toBe(
      "https://example.com/catalog",
    );
    expect(publicHref("http://localhost:3000/info", true)).toBe(
      "http://localhost:3000/info",
    );
    expect(publicHref("http://localhost:3000/info")).toBeNull();
  });

  it("builds a public Storage URL only from a safe object path", () => {
    expect(
      publicAssetUrl(
        "http://127.0.0.1:54321",
        "public-assets",
        "products/cincin emas.webp",
      ),
    ).toBe(
      "http://127.0.0.1:54321/storage/v1/object/public/public-assets/products/cincin%20emas.webp",
    );
    expect(
      publicAssetUrl("http://127.0.0.1:54321", "public-assets", "../secret"),
    ).toBeNull();
  });
});
