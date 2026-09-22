import "server-only";

import { asc, desc, eq, isNull } from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";
import {
  campaigns,
  contentSections,
  links,
  productBranches,
  products,
} from "@/lib/db/schema";

import { getBranch } from "./data";

export async function getBranchPageSettings(id: string) {
  const branch = await getBranch(id);
  const db = getDatabase();
  const scoped = await db
    .select()
    .from(contentSections)
    .where(eq(contentSections.branchId, branch.id))
    .orderBy(asc(contentSections.sortOrder), asc(contentSections.id));
  const sections = scoped.length
    ? scoped
    : await db
        .select()
        .from(contentSections)
        .where(isNull(contentSections.branchId))
        .orderBy(asc(contentSections.sortOrder), asc(contentSections.id));
  const [branchCampaigns, branchLinks, productRows, assignmentRows] =
    await Promise.all([
      db
        .select()
        .from(campaigns)
        .where(eq(campaigns.branchId, branch.id))
        .orderBy(asc(campaigns.sortOrder), desc(campaigns.createdAt)),
      db
        .select()
        .from(links)
        .where(eq(links.branchId, branch.id))
        .orderBy(asc(links.sortOrder), asc(links.id)),
      db
        .select({
          id: products.id,
          name: products.name,
          isActive: products.isActive,
        })
        .from(products)
        .orderBy(asc(products.sortOrder), asc(products.name)),
      db
        .select({
          productId: productBranches.productId,
          displayName: productBranches.displayName,
          isActive: productBranches.isActive,
        })
        .from(productBranches)
        .where(eq(productBranches.branchId, branch.id)),
    ]);
  const assignmentByProductId = new Map(
    assignmentRows.map((row) => [row.productId, row]),
  );
  return {
    branch,
    sections,
    inheritsSections: scoped.length === 0,
    campaigns: branchCampaigns,
    links: branchLinks,
    products: productRows.map((product) => ({
      ...product,
      assignment: assignmentByProductId.get(product.id) ?? null,
    })),
  };
}
