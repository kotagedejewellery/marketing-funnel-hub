import { describe, expect, it } from "vitest";

import { resolvePageBlocks } from "./page-blocks";

describe("resolvePageBlocks", () => {
  const sections = [
    { sectionKey: "brand_header" },
    { sectionKey: "campaign_banner" },
    { sectionKey: "faq" },
  ];
  const products = [{ assignmentId: "assignment-1", name: "Cincin Nikah" }];
  const links = [{ id: "link-1", label: "Katalog" }];

  it("renders a custom page layout in its saved cross-content order", () => {
    expect(
      resolvePageBlocks({
        sections,
        products,
        links,
        blocks: [
          { kind: "section", sectionKey: "brand_header" },
          { kind: "link", linkId: "link-1" },
          { kind: "section", sectionKey: "campaign_banner" },
          { kind: "product", productBranchId: "assignment-1" },
          { kind: "section", sectionKey: "faq" },
        ],
      }),
    ).toEqual([
      { kind: "section", section: sections[0] },
      { kind: "link", link: links[0] },
      { kind: "section", section: sections[1] },
      { kind: "product", product: products[0] },
      { kind: "section", section: sections[2] },
    ]);
  });

  it("falls back to the existing section layout until a branch customizes it", () => {
    expect(
      resolvePageBlocks({ sections, products, links, blocks: [] }),
    ).toEqual(sections.map((section) => ({ kind: "section", section })));
  });

  it("does not render a block whose linked content is unavailable", () => {
    expect(
      resolvePageBlocks({
        sections,
        products,
        links,
        blocks: [
          { kind: "link", linkId: "missing" },
          { kind: "product", productBranchId: "assignment-1" },
        ],
      }),
    ).toEqual([{ kind: "product", product: products[0] }]);
  });
});
