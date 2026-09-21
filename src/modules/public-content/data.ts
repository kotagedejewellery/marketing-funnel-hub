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

export async function loadPublicContent(now = new Date()) {
  const db = getDatabase();
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
      .where(eq(links.isActive, true))
      .orderBy(asc(links.sortOrder), asc(links.id)),
    db
      .select({ sectionKey: contentSections.sectionKey })
      .from(contentSections)
      .where(eq(contentSections.isActive, true))
      .orderBy(asc(contentSections.sortOrder), asc(contentSections.id)),
  ]);

  const campaign = eligibleCampaigns[0];

  return {
    site: {
      siteName: site.siteName,
      headline: site.headline,
      introduction: site.introduction,
      logoUrl: assetUrl(site.logoPath),
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
    products: activeProducts.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      imageUrl: assetUrl(product.imagePath),
      branches: activeBranches
        .filter((branch) => branch.productId === product.id)
        .map((branch) => {
          const cta = resolveWhatsappCta({
            number: branch.whatsappNumber,
            product: product.name,
            branch: branch.name,
            assignmentLabel: branch.assignmentLabel,
            branchLabel: branch.branchLabel,
            defaultLabel: site.defaultCtaLabel,
            assignmentMessage: branch.assignmentMessage,
            defaultMessage: site.defaultWhatsappMessage,
          });
          return {
            id: branch.id,
            name: branch.name,
            slug: branch.slug,
            ctaLabel: cta.ctaLabel,
            whatsappUrl: cta.whatsappUrl,
          };
        }),
    })),
    links: activeLinks.flatMap((link) => {
      const url = safeHref(link.url);
      return url ? [{ ...link, url }] : [];
    }),
    sections: activeSections,
  };
}

export type PublicContent = Awaited<ReturnType<typeof loadPublicContent>>;
