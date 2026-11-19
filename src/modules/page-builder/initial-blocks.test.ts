import { describe, expect, it } from "vitest";

import { initialPageBuilderBlocks } from "./initial-blocks";

const ids = {
  logo: "11111111-1111-4111-8111-111111111111",
  header: "22222222-2222-4222-8222-222222222222",
  products: "33333333-3333-4333-8333-333333333333",
  footer: "44444444-4444-4444-8444-444444444444",
  assignment: "55555555-5555-4555-8555-555555555555",
};

describe("initialPageBuilderBlocks", () => {
  it("uses the currently visible legacy page when no builder draft exists", () => {
    expect(
      initialPageBuilderBlocks({
        draftBlocks: [],
        publishedBlocks: [],
        legacyBlocks: [
          { id: ids.header, kind: "section", sectionKey: "brand_header" },
          {
            id: ids.assignment,
            kind: "product",
            productBranchId: ids.assignment,
          },
        ],
        sections: [
          { id: ids.logo, sectionKey: "profile_logo", isActive: true },
          { id: ids.header, sectionKey: "brand_header", isActive: true },
          { id: ids.footer, sectionKey: "footer", isActive: true },
        ],
        assignments: [{ id: ids.assignment, isActive: true }],
        links: [],
      }),
    ).toEqual([
      expect.objectContaining({ type: "section", sectionKey: "profile_logo" }),
      expect.objectContaining({ type: "section", sectionKey: "brand_header" }),
      expect.objectContaining({
        type: "product_cta",
        assignmentId: ids.assignment,
      }),
      expect.objectContaining({ type: "section", sectionKey: "footer" }),
    ]);
  });

  it("keeps an existing draft unchanged", () => {
    const draftBlocks = [
      {
        id: ids.header,
        type: "rich_text" as const,
        text: "Pesan draft",
        width: "full" as const,
        isVisible: true,
      },
    ];

    expect(
      initialPageBuilderBlocks({
        draftBlocks,
        publishedBlocks: [],
        legacyBlocks: [],
        sections: [],
        assignments: [],
        links: [],
      }),
    ).toEqual(draftBlocks);
  });
});
