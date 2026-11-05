import "server-only";

import { asc, eq, isNull, max, sql } from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";
import {
  contentSections,
  links,
  pageBlocks,
  productBranches,
} from "@/lib/db/schema";

type Transaction = Parameters<
  Parameters<ReturnType<typeof getDatabase>["transaction"]>[0]
>[0];

type PageBlockReference =
  | { kind: "product"; productBranchId: string }
  | { kind: "link"; linkId: string };

export async function appendPageBlockIfCustomized(
  tx: Transaction,
  branchId: string,
  reference: PageBlockReference,
  placement: "start" | "end" = "end",
) {
  const [existingBlock] = await tx
    .select({ id: pageBlocks.id })
    .from(pageBlocks)
    .where(eq(pageBlocks.branchId, branchId))
    .limit(1);
  if (!existingBlock) return;

  if (placement === "start") {
    await tx
      .update(pageBlocks)
      .set({
        sortOrder: sql`${pageBlocks.sortOrder} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(pageBlocks.branchId, branchId));
  }
  const [lastBlock] =
    placement === "end"
      ? await tx
          .select({ value: max(pageBlocks.sortOrder) })
          .from(pageBlocks)
          .where(eq(pageBlocks.branchId, branchId))
      : [{ value: -1 }];
  await tx
    .insert(pageBlocks)
    .values({
      branchId,
      ...reference,
      sortOrder: placement === "start" ? 0 : Number(lastBlock?.value ?? -1) + 1,
    })
    .onConflictDoNothing();
}

export async function createInitialPageBlocks(
  tx: Transaction,
  branchId: string,
) {
  const [existingBlock] = await tx
    .select({ id: pageBlocks.id })
    .from(pageBlocks)
    .where(eq(pageBlocks.branchId, branchId))
    .limit(1);
  if (existingBlock) return false;

  const scopedSections = await tx
    .select({ sectionKey: contentSections.sectionKey })
    .from(contentSections)
    .where(eq(contentSections.branchId, branchId))
    .orderBy(asc(contentSections.sortOrder), asc(contentSections.id));
  const [globalSections, assignments, branchLinks] = await Promise.all([
    tx
      .select({ sectionKey: contentSections.sectionKey })
      .from(contentSections)
      .where(isNull(contentSections.branchId))
      .orderBy(asc(contentSections.sortOrder), asc(contentSections.id)),
    tx
      .select({ id: productBranches.id })
      .from(productBranches)
      .where(eq(productBranches.branchId, branchId))
      .orderBy(asc(productBranches.sortOrder), asc(productBranches.id)),
    tx
      .select({ id: links.id, linkType: links.linkType })
      .from(links)
      .where(eq(links.branchId, branchId))
      .orderBy(asc(links.sortOrder), asc(links.id)),
  ]);
  const sections = scopedSections.length ? scopedSections : globalSections;
  if (sections.length === 0) return false;

  const blocks: (
    | { kind: "section"; sectionKey: string }
    | { kind: "product"; productBranchId: string }
    | { kind: "link"; linkId: string }
  )[] = [];
  for (const section of sections) {
    if (
      section.sectionKey === "profile_logo" ||
      section.sectionKey === "footer"
    )
      continue;
    if (section.sectionKey === "products") {
      blocks.push({ kind: "section", sectionKey: section.sectionKey });
      blocks.push(
        ...assignments.map((assignment) => ({
          kind: "product" as const,
          productBranchId: assignment.id,
        })),
      );
      continue;
    }
    if (section.sectionKey === "secondary_links") {
      blocks.push({ kind: "section", sectionKey: section.sectionKey });
      blocks.push(
        ...branchLinks
          .filter(
            (link) => link.linkType === "secondary" || link.linkType === "cta",
          )
          .map((link) => ({ kind: "link" as const, linkId: link.id })),
      );
      continue;
    }
    if (section.sectionKey === "social_links") {
      blocks.push({ kind: "section", sectionKey: section.sectionKey });
      blocks.push(
        ...branchLinks
          .filter((link) => link.linkType === "social")
          .map((link) => ({ kind: "link" as const, linkId: link.id })),
      );
      continue;
    }
    blocks.push({ kind: "section", sectionKey: section.sectionKey });
  }
  if (blocks.length === 0) return false;

  await tx
    .insert(pageBlocks)
    .values(
      blocks.map((block, sortOrder) => ({ branchId, ...block, sortOrder })),
    );
  return true;
}
