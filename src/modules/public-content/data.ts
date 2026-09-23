import "server-only";

import { and, asc, desc, eq, gte, isNull, lte, or, sql } from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";
import { serverEnv } from "@/lib/env/server";
import {
  branches,
  campaigns,
  contentSections,
  faqs,
  links,
  productBranches,
  products,
  siteSettings,
} from "@/lib/db/schema";

import { branchPageTitle } from "./branch-title";
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

export async function loadBranchDirectory() {
  const db = getDatabase();
  const [settings, activeBranches] = await Promise.all([
    db
      .select({
        siteName: siteSettings.siteName,
        logoPath: siteSettings.logoPath,
        privacyUrl: siteSettings.privacyUrl,
      })
      .from(siteSettings)
      .limit(1),
    db
      .select({ name: branches.name, slug: branches.slug })
      .from(branches)
      .where(eq(branches.isActive, true))
      .orderBy(asc(branches.sortOrder), asc(branches.name), asc(branches.id)),
  ]);
  if (!settings[0]) throw new Error("Public site settings are missing.");
  return {
    siteName: settings[0].siteName,
    logoUrl: assetUrl(settings[0].logoPath),
    privacyUrl: safeHref(settings[0].privacyUrl),
    branches: activeBranches,
  };
}

export async function loadBranchPublicContent(
  slug: string,
  now = new Date(),
  includeInactive = false,
) {
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
    .where(
      includeInactive
        ? eq(branches.slug, slug)
        : and(eq(branches.slug, slug), eq(branches.isActive, true)),
    )
    .limit(1);

  return branch ? loadScopedContent(now, branch, includeInactive) : null;
}

async function loadScopedContent(
  now: Date,
  branch: BranchScope,
  includeInactive = false,
) {
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
    pageFaqs,
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
          eq(campaigns.branchId, branch.id),
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
        showImage: productBranches.showImage,
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
          ...(includeInactive ? [] : [eq(branches.isActive, true)]),
          eq(branches.id, branch.id),
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
      .where(and(eq(links.isActive, true), eq(links.branchId, branch.id)))
      .orderBy(asc(links.sortOrder), asc(links.id)),
    db
      .select({
        sectionKey: contentSections.sectionKey,
        isActive: contentSections.isActive,
      })
      .from(contentSections)
      .where(eq(contentSections.branchId, branch.id))
      .orderBy(asc(contentSections.sortOrder), asc(contentSections.id)),
    db
      .select({
        id: faqs.id,
        branchId: faqs.branchId,
        question: faqs.question,
        answer: faqs.answer,
        isActive: faqs.isActive,
      })
      .from(faqs)
      .where(or(isNull(faqs.branchId), eq(faqs.branchId, branch.id)))
      .orderBy(asc(faqs.sortOrder), asc(faqs.id)),
  ]);

  const campaign = eligibleCampaigns[0];
  const sections =
    activeSections.length === 0
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
  const visibleProducts = activeProducts
    .filter((product) => branchAssignments.has(product.id))
    .sort((a, b) => {
      const aOrder = branchAssignments.get(a.id)?.assignmentSortOrder ?? 0;
      const bOrder = branchAssignments.get(b.id)?.assignmentSortOrder ?? 0;
      return aOrder - bOrder || a.name.localeCompare(b.name);
    });
  const scopedFaqs = pageFaqs.filter((faq) => faq.branchId === branch.id);
  const visibleFaqs = (scopedFaqs.length ? scopedFaqs : pageFaqs)
    .filter((faq) => faq.isActive)
    .map(({ id, question, answer }) => ({ id, question, answer }));

  return {
    site: {
      siteName: branchPageTitle(site.siteName, branch.name),
      headline: branch.headline || site.headline,
      introduction: branch.introduction || site.introduction,
      logoUrl: assetUrl(branch.logoPath || site.logoPath),
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
      const assignment = branchAssignments.get(product.id);
      const displayName = assignment?.displayName || product.name;
      const showImage = assignment?.showImage ?? true;
      return {
        id: product.id,
        name: displayName,
        slug: product.slug,
        description: assignment?.displayDescription || product.description,
        showImage,
        imageUrl: showImage
          ? assetUrl(assignment?.displayImagePath || product.imagePath)
          : null,
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
    faqs: visibleFaqs,
    sections: sections
      .filter((section) => section.isActive)
      .map(({ sectionKey }) => ({ sectionKey })),
    pageBranch: { id: branch.id, name: branch.name, slug: branch.slug },
  };
}

export type PublicContent = Awaited<ReturnType<typeof loadScopedContent>>;
