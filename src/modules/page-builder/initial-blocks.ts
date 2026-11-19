import { branchSectionKeys } from "@/modules/admin/branches/page-validation";

import type { PageBuilderBlock } from "./schema";

type SectionKey = (typeof branchSectionKeys)[number];

export type LegacyBuilderBlock =
  | { id: string; kind: "section"; sectionKey: SectionKey }
  | { id: string; kind: "product"; productBranchId: string }
  | { id: string; kind: "link"; linkId: string };

type Input = {
  draftBlocks: PageBuilderBlock[];
  publishedBlocks: PageBuilderBlock[];
  legacyBlocks: LegacyBuilderBlock[];
  sections: { id: string; sectionKey: SectionKey; isActive: boolean }[];
  assignments: { id: string; isActive: boolean }[];
  links: { id: string; linkType: string; isActive: boolean }[];
};

function sectionBlock(id: string, sectionKey: SectionKey): PageBuilderBlock {
  return { id, type: "section", sectionKey, width: "full", isVisible: true };
}

function withProfileAndFooter(
  blocks: PageBuilderBlock[],
  sections: Input["sections"],
) {
  const profile = sections.find(
    (section) => section.isActive && section.sectionKey === "profile_logo",
  );
  const footer = sections.find(
    (section) => section.isActive && section.sectionKey === "footer",
  );
  const withoutFrame = blocks.filter(
    (block) =>
      block.type !== "section" ||
      (block.sectionKey !== "profile_logo" && block.sectionKey !== "footer"),
  );
  return [
    ...(profile ? [sectionBlock(profile.id, profile.sectionKey)] : []),
    ...withoutFrame,
    ...(footer ? [sectionBlock(footer.id, footer.sectionKey)] : []),
  ];
}

export function initialPageBuilderBlocks({
  draftBlocks,
  publishedBlocks,
  legacyBlocks,
  sections,
  assignments,
  links,
}: Input): PageBuilderBlock[] {
  if (draftBlocks.length) return draftBlocks;
  if (publishedBlocks.length) return publishedBlocks;

  const activeSections = new Map(
    sections
      .filter((section) => section.isActive)
      .map((section) => [section.sectionKey, section]),
  );
  const activeAssignments = new Set(
    assignments.filter((assignment) => assignment.isActive).map(({ id }) => id),
  );
  const activeLinks = new Map(
    links.filter((link) => link.isActive).map((link) => [link.id, link]),
  );
  const blocks = legacyBlocks.flatMap((block): PageBuilderBlock[] => {
    if (block.kind === "section") {
      return activeSections.has(block.sectionKey)
        ? [sectionBlock(block.id, block.sectionKey)]
        : [];
    }
    if (block.kind === "product") {
      return activeAssignments.has(block.productBranchId)
        ? [
            {
              id: block.id,
              type: "product_cta",
              assignmentId: block.productBranchId,
              width: "full",
              isVisible: true,
            },
          ]
        : [];
    }
    return activeLinks.has(block.linkId)
      ? [
          {
            id: block.id,
            type: "link",
            linkId: block.linkId,
            width: "full",
            isVisible: true,
          },
        ]
      : [];
  });
  if (blocks.length) return withProfileAndFooter(blocks, sections);

  const bootstrap: PageBuilderBlock[] = [];
  for (const section of sections) {
    if (!section.isActive || section.sectionKey === "profile_logo") continue;
    if (section.sectionKey === "footer") continue;
    bootstrap.push(sectionBlock(section.id, section.sectionKey));
    if (section.sectionKey === "products") {
      bootstrap.push(
        ...assignments
          .filter((assignment) => assignment.isActive)
          .map((assignment) => ({
            id: assignment.id,
            type: "product_cta" as const,
            assignmentId: assignment.id,
            width: "full" as const,
            isVisible: true,
          })),
      );
    }
    if (
      section.sectionKey === "secondary_links" ||
      section.sectionKey === "social_links"
    ) {
      bootstrap.push(
        ...links
          .filter(
            (link) =>
              link.isActive &&
              (section.sectionKey === "social_links"
                ? link.linkType === "social"
                : link.linkType === "secondary" || link.linkType === "cta"),
          )
          .map((link) => ({
            id: link.id,
            type: "link" as const,
            linkId: link.id,
            width: "full" as const,
            isVisible: true,
          })),
      );
    }
  }
  return withProfileAndFooter(bootstrap, sections);
}
