import { describe, expect, it } from "vitest";

import { linkSchema } from "./validation";

describe("linkSchema", () => {
  const link = {
    id: "",
    branchId: "",
    label: "Lihat katalog",
    url: "https://example.com/katalog",
    linkType: "cta",
    buttonStyle: "outline",
    platform: "",
    iconKey: "catalog",
    isActive: true,
    sortOrder: "0",
    layoutPlacement: "start",
  };

  it("accepts a controlled CTA style, icon, and initial placement", () => {
    expect(linkSchema.parse(link)).toMatchObject({
      buttonStyle: "outline",
      iconKey: "catalog",
      layoutPlacement: "start",
    });
  });

  it("rejects an uncontrolled CTA style", () => {
    expect(linkSchema.safeParse({ ...link, buttonStyle: "neon" }).success).toBe(
      false,
    );
  });

  it("accepts only a standard CTA-specific Meta event", () => {
    expect(linkSchema.parse({ ...link, metaEventName: "Lead" })).toMatchObject({
      metaEventName: "Lead",
    });
    expect(
      linkSchema.safeParse({ ...link, metaEventName: "CTA_Katalog_November" })
        .success,
    ).toBe(false);
  });
});
