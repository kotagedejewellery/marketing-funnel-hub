import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { loadPublicContent } from "./data";

describe("public content loader", () => {
  it("reads local site settings and active sections with the application role", async () => {
    const content = await loadPublicContent();

    expect(content.site.siteName).toBe("KGJ");
    expect(content.sections.map((section) => section.sectionKey)).toEqual([
      "brand_header",
      "campaign_banner",
      "products",
      "secondary_links",
      "social_links",
      "footer",
    ]);
    expect(content.campaign).toBeNull();
    expect(content.products).toEqual([]);
  });
});
