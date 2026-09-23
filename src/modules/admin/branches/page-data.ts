import "server-only";

import { asc, desc, eq, isNull } from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";
import {
  campaigns,
  contentSections,
  faqs,
  galleryItems,
  links,
  productBranches,
  products,
} from "@/lib/db/schema";

import { getBranch } from "./data";
import { branchSectionKeys, branchSectionLabels } from "./page-validation";

function withSectionLabel<T extends { sectionKey: string; label: string }>(
  section: T,
) {
  const sectionKey = branchSectionKeys.find(
    (candidate) => candidate === section.sectionKey,
  );
  return {
    ...section,
    label: sectionKey ? branchSectionLabels[sectionKey] : section.label,
  };
}

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
  const [
    branchCampaigns,
    branchLinks,
    branchFaqs,
    branchGallery,
    productRows,
    assignmentRows,
  ] = await Promise.all([
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
      .select()
      .from(faqs)
      .where(eq(faqs.branchId, branch.id))
      .orderBy(asc(faqs.sortOrder), asc(faqs.id)),
    db
      .select()
      .from(galleryItems)
      .where(eq(galleryItems.branchId, branch.id))
      .orderBy(asc(galleryItems.sortOrder), asc(galleryItems.id)),
    db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        description: products.description,
        isActive: products.isActive,
        sortOrder: products.sortOrder,
      })
      .from(products)
      .orderBy(asc(products.sortOrder), asc(products.name)),
    db
      .select({
        id: productBranches.id,
        productId: productBranches.productId,
        displayName: productBranches.displayName,
        description: productBranches.description,
        ctaLabel: productBranches.ctaLabel,
        whatsappMessageTemplate: productBranches.whatsappMessageTemplate,
        isActive: productBranches.isActive,
        sortOrder: productBranches.sortOrder,
      })
      .from(productBranches)
      .where(eq(productBranches.branchId, branch.id)),
  ]);
  const assignmentByProductId = new Map(
    assignmentRows.map((row) => [row.productId, row]),
  );
  const inheritedFaqs = branchFaqs.length
    ? []
    : await db
        .select()
        .from(faqs)
        .where(isNull(faqs.branchId))
        .orderBy(asc(faqs.sortOrder), asc(faqs.id));
  return {
    branch,
    sections: sections.map(withSectionLabel),
    inheritsSections: scoped.length === 0,
    campaigns: branchCampaigns,
    links: branchLinks,
    gallery: branchGallery,
    faqs: branchFaqs.length ? branchFaqs : inheritedFaqs,
    inheritsFaqs: branchFaqs.length === 0,
    products: productRows
      .map((product) => ({
        ...product,
        assignment: assignmentByProductId.get(product.id) ?? null,
      }))
      .sort((a, b) => {
        const aActive = Number(Boolean(a.assignment?.isActive));
        const bActive = Number(Boolean(b.assignment?.isActive));
        return (
          bActive - aActive ||
          (a.assignment?.sortOrder ?? a.sortOrder) -
            (b.assignment?.sortOrder ?? b.sortOrder) ||
          a.name.localeCompare(b.name)
        );
      }),
  };
}
