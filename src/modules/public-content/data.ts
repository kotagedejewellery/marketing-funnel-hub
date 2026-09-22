import "server-only";

import { and, asc, desc, eq, gte, isNull, lte, or, sql } from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";
import { serverEnv } from "@/lib/env/server";
import {
  branches,
  campaigns,
  contentSections,
  links,
  productBranches,
  products,
  siteSettings,
} from "@/lib/db/schema";

import { publicAssetUrl, publicHref, resolveWhatsappCta } from "./links";

const assetUrl = (path: string | null) =>
  publicAssetUrl(
    serverEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_PUBLIC_ASSET_BUCKET,
    path,
  );

const safeHref = (value: string | null) =>
  publicHref(value, serverEnv.NEXT_PUBLIC_APP_ENV === "local");

type BranchScope = Pick<
  typeof branches.$inferSelect,
  "id" | "name" | "slug" | "headline" | "introduction" | "logoPath"
>;

export async function loadPublicContent(now = new Date()) {
  return loadScopedContent(now, null);
}

export async function loadBranchPublicContent(slug: string, now = new Date()) {
  const [branch] = await getDatabase()
    .select({
      id: branches.id,
      name: branches.name,
      slug: branches.slug,
      headline: branches.headline,
      introduction: branches.introduction,
      logoPath: branches.logoPath,
    })
    .from(branches)
    .where(and(eq(branches.slug, slug), eq(branches.isActive, true)))
    .limit(1);

  return branch ? loadScopedContent(now, branch) : null;
}

async function loadScopedContent(now: Date, branch: BranchScope | null) {
  const db = getDatabase();
  const scope = branch
    ? eq(campaigns.branchId, branch.id)
    : isNull(campaigns.branchId);
  const [site] = await db
    .select({
      siteName: siteSettings.siteName,
      headline: siteSettings.headline,
      introduction: siteSettings.introduction,
      logoPath: siteSettings.logoPath,
      privacyUrl: siteSettings.privacyUrl,
      defaultWhatsappMessage: siteSettings.defaultWhatsappMessage,
      defaultCtaLabel: siteSettings.defaultCtaLabel,
    })
    .from(siteSettings)
    .limit(1);

  if (!site) throw new Error("Public site settings are missing.");

  const [
    eligibleCampaigns,
    activeProducts,
    activeBranches,
    activeLinks,
    activeSections,
  ] = await Promise.all([
    db
      .select({
        id: campaigns.id,
        title: campaigns.title,
        description: campaigns.description,
        bannerPath: campaigns.bannerPath,
        targetUrl: campaigns.targetUrl,
      })
      .from(campaigns)
      .where(
        and(
          eq(campaigns.isActive, true),
          scope,
          or(isNull(campaigns.activeFrom), lte(campaigns.activeFrom, now)),
          or(isNull(campaigns.activeUntil), gte(campaigns.activeUntil, now)),
        ),
      )
      .orderBy(
        asc(campaigns.sortOrder),
        sql`${campaigns.activeFrom} desc nulls last`,
        desc(campaigns.createdAt),
        asc(campaigns.id),
      )
      .limit(1),
    db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        description: products.description,
        imagePath: products.imagePath,
      })
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(asc(products.sortOrder), asc(products.name), asc(products.id)),
    db
      .select({
        productId: productBranches.productId,
        assignmentSortOrder: productBranches.sortOrder,
        displayName: productBranches.displayName,
        displayDescription: productBranches.description,
        displayImagePath: productBranches.imagePath,
        id: branches.id,
        name: branches.name,
        slug: branches.slug,
        whatsappNumber: branches.whatsappNumber,
        assignmentMessage: productBranches.whatsappMessageTemplate,
        assignmentLabel: productBranches.ctaLabel,
        branchLabel: branches.ctaLabel,
      })
      .from(productBranches)
      .innerJoin(products, eq(productBranches.productId, products.id))
      .innerJoin(branches, eq(productBranches.branchId, branches.id))
      .where(
        and(
          eq(products.isActive, true),
          eq(productBranches.isActive, true),
          eq(branches.isActive, true),
          ...(branch ? [eq(branches.id, branch.id)] : []),
        ),
      )
      .orderBy(
        asc(productBranches.sortOrder),
        asc(branches.sortOrder),
        asc(branches.name),
        asc(branches.id),
      ),
    db
      .select({
        id: links.id,
        label: links.label,
        url: links.url,
        linkType: links.linkType,
        platform: links.platform,
      })
      .from(links)
      .where(
        and(
          eq(links.isActive, true),
          branch ? eq(links.branchId, branch.id) : isNull(links.branchId),
        ),
      )
      .orderBy(asc(links.sortOrder), asc(links.id)),
    db
      .select({
        sectionKey: contentSections.sectionKey,
        isActive: contentSections.isActive,
      })
      .from(contentSections)
      .where(
        branch
          ? eq(contentSections.branchId, branch.id)
          : isNull(contentSections.branchId),
      )
      .orderBy(asc(contentSections.sortOrder), asc(contentSections.id)),
  ]);

  const campaign = eligibleCampaigns[0];
  const sections =
    branch && activeSections.length === 0
      ? await db
          .select({
            sectionKey: contentSections.sectionKey,
            isActive: contentSections.isActive,
          })
          .from(contentSections)
          .where(isNull(contentSections.branchId))
          .orderBy(asc(contentSections.sortOrder), asc(contentSections.id))
      : activeSections;
  const branchAssignments = new Map(
    activeBranches.map((assignment) => [assignment.productId, assignment]),
  );
  const visibleProducts = branch
    ? activeProducts
        .filter((product) => branchAssignments.has(product.id))
        .sort((a, b) => {
          const aOrder = branchAssignments.get(a.id)?.assignmentSortOrder ?? 0;
          const bOrder = branchAssignments.get(b.id)?.assignmentSortOrder ?? 0;
          return aOrder - bOrder || a.name.localeCompare(b.name);
        })
    : activeProducts;

  return {
    site: {
      siteName: branch ? `${site.siteName} ${branch.name}` : site.siteName,
      headline: branch?.headline || site.headline,
      introduction: branch?.introduction || site.introduction,
      logoUrl: assetUrl(branch?.logoPath || site.logoPath),
      privacyUrl: safeHref(site.privacyUrl),
    },
    campaign: campaign
      ? {
          id: campaign.id,
          title: campaign.title,
          description: campaign.description,
          bannerUrl: assetUrl(campaign.bannerPath),
          targetUrl: safeHref(campaign.targetUrl),
        }
      : null,
    products: visibleProducts.map((product) => {
      const assignment = branch ? branchAssignments.get(product.id) : null;
      const displayName = assignment?.displayName || product.name;
      return {
        id: product.id,
        name: displayName,
        slug: product.slug,
        description: assignment?.displayDescription || product.description,
        imageUrl: assetUrl(assignment?.displayImagePath || product.imagePath),
        branches: activeBranches
          .filter((item) => item.productId === product.id)
          .map((item) => {
            const cta = resolveWhatsappCta({
              number: item.whatsappNumber,
              product: displayName,
              branch: item.name,
              assignmentLabel: item.assignmentLabel,
              branchLabel: item.branchLabel,
              defaultLabel: site.defaultCtaLabel,
              assignmentMessage: item.assignmentMessage,
              defaultMessage: site.defaultWhatsappMessage,
            });
            return {
              id: item.id,
              name: item.name,
              slug: item.slug,
              ctaLabel: cta.ctaLabel,
              whatsappUrl: cta.whatsappUrl,
            };
          }),
      };
    }),
    links: activeLinks.flatMap((link) => {
      const url = safeHref(link.url);
      return url ? [{ ...link, url }] : [];
    }),
    sections: sections
      .filter((section) => section.isActive)
      .map(({ sectionKey }) => ({ sectionKey })),
    ...(branch && {
      pageBranch: { id: branch.id, name: branch.name, slug: branch.slug },
    }),
  };
}

export type PublicContent = Awaited<ReturnType<typeof loadPublicContent>>;
