type Section = { sectionKey: string };
type Product = { assignmentId: string };
type Link = { id: string };

type PageBlock =
  | { kind: "section"; sectionKey: string }
  | { kind: "product"; productBranchId: string }
  | { kind: "link"; linkId: string };

type ResolvedPageBlock<TSection, TProduct, TLink> =
  | { kind: "section"; section: TSection }
  | { kind: "product"; product: TProduct }
  | { kind: "link"; link: TLink };

export function resolvePageBlocks<
  TSection extends Section,
  TProduct extends Product,
  TLink extends Link,
>({
  sections,
  products,
  links,
  blocks,
}: {
  sections: TSection[];
  products: TProduct[];
  links: TLink[];
  blocks: PageBlock[];
}): ResolvedPageBlock<TSection, TProduct, TLink>[] {
  const pageBlocks =
    blocks.length > 0
      ? blocks
      : sections.map((section) => ({
          kind: "section" as const,
          sectionKey: section.sectionKey,
        }));
  const sectionsByKey = new Map(
    sections.map((section) => [section.sectionKey, section]),
  );
  const productsByAssignmentId = new Map(
    products.map((product) => [product.assignmentId, product]),
  );
  const linksById = new Map(links.map((link) => [link.id, link]));

  const resolved: ResolvedPageBlock<TSection, TProduct, TLink>[] = [];
  for (const block of pageBlocks) {
    if (block.kind === "section") {
      const section = sectionsByKey.get(block.sectionKey);
      if (section) resolved.push({ kind: "section", section });
      continue;
    }
    if (block.kind === "product") {
      const product = productsByAssignmentId.get(block.productBranchId);
      if (product) resolved.push({ kind: "product", product });
      continue;
    }
    const link = linksById.get(block.linkId);
    if (link) resolved.push({ kind: "link", link });
  }
  return resolved;
}
