import Link from "next/link";
import { BranchForm } from "@/components/admin/branch-form";
import { BranchMetaTrackingManager } from "@/components/admin/branch-meta-tracking-manager";
import { BranchPageBuilder } from "@/components/admin/branch-page-builder";
import { BranchPageForm } from "@/components/admin/branch-page-form";
import { BranchProductManager } from "@/components/admin/branch-product-manager";
import { FaqManager } from "@/components/admin/faq-manager";
import { FormDialog } from "@/components/admin/form-dialog";
import { GalleryManager } from "@/components/admin/gallery-manager";
import { GoogleReviewManager } from "@/components/admin/google-review-manager";
import { MediaUploadField } from "@/components/admin/media-upload-field";
import {
  PageCampaigns,
  PageLinks,
} from "@/components/admin/page-content-panels";
import { PagePreview } from "@/components/admin/page-preview";
import { serverEnv } from "@/lib/env/server";
import { requireAdmin } from "@/modules/admin/access";
import { getBranchPageSettings } from "@/modules/admin/branches/page-data";
import { getPageSourceSummary } from "@/modules/admin/branches/page-source-summary";
import { getBranchMetaTrackingSecretsForTechnicalAdmin } from "@/modules/admin/tracking/branch-meta-secrets";
import { publicAssetUrl } from "@/modules/public-content/links";
export default async function BranchLinkBioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireAdmin();
  const { id } = await params;
  const isTechnicalAdmin = profile.role === "technical_admin";
  const {
    branch,
    sections,
    inheritsSections,
    campaigns,
    gallery,
    reviewSource,
    reviews,
    links,
    faqs,
    inheritsFaqs,
    products,
    builderLayout,
    metaTracking,
  } = await getBranchPageSettings(id);
  const metaSecrets = isTechnicalAdmin
    ? await getBranchMetaTrackingSecretsForTechnicalAdmin(id)
    : null;
  const assetUrl = (path: string | null) =>
    publicAssetUrl(serverEnv.MEDIA_PUBLIC_BASE_URL, path);
  const activeProducts = products.filter(
    (product) => product.isActive && product.assignment?.isActive,
  );
  const activeLinks = links.filter((link) => link.isActive);
  return (
    <div>
      {" "}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        {" "}
        <div>
          {" "}
          <Link
            href="/admin/link-bio"
            className="text-sm font-semibold underline underline-offset-4"
          >
            {" "}
            Kembali ke semua halaman{" "}
          </Link>{" "}
          <p className="mt-2 text-sm text-muted-foreground">
            {" "}
            Halaman publik: /{branch.slug} ?? WhatsApp:{" "}
            {branch.whatsappNumber}{" "}
          </p>{" "}
        </div>{" "}
        <div className="flex items-center gap-3">
          {" "}
          <span className="rounded-full bg-secondary px-3 py-2 text-sm font-semibold">
            {" "}
            {branch.isActive ? "Cabang aktif" : "Cabang nonaktif"}{" "}
          </span>{" "}
          <FormDialog
            title={`Edit informasi ${branch.name}`}
            triggerLabel="Edit cabang"
          >
            {" "}
            <BranchForm branch={branch} />{" "}
          </FormDialog>{" "}
        </div>{" "}
      </header>{" "}
      <BranchPageBuilder
        branchId={branch.id}
        branchName={branch.name}
        initialBlocks={builderLayout.initialBlocks}
        initialRevision={builderLayout.revision}
        publishedBlocks={builderLayout.publishedBlocks}
        isPublished={builderLayout.isPublished}
        publishedAt={builderLayout.publishedAt}
        catalog={{
          sections: sections
            .filter((section) => section.isActive)
            .map(({ sectionKey, label, publicTitle }) => ({
              sectionKey,
              label,
              publicTitle,
            })),
          products: activeProducts,
          links: activeLinks.map(({ id: linkId, label }) => ({
            id: linkId,
            label,
          })),
          sourceSummary: getPageSourceSummary({
            now: new Date(),
            branchIsActive: branch.isActive,
            logoPath: branch.logoPath,
            campaigns,
            gallery,
            activeCtaCount: activeProducts.length,
            reviewSource: reviewSource
              ? {
                  ...reviewSource,
                  displayMode:
                    reviewSource.displayMode === "manual"
                      ? "manual"
                      : "automatic",
                }
              : null,
            reviews,
            faqs,
            inheritsFaqs,
            activeLinkCount: activeLinks.length,
            activeSectionCount: sections.filter((item) => item.isActive).length,
          }),
        }}
        dataTools={{
          identity: (
            <FormDialog
              title={`Profil ${branch.name}`}
              triggerLabel="Atur profil & logo"
              refreshBuilderData
              dataTool="identity"
            >
              {" "}
              <div className="space-y-6">
                {" "}
                <BranchPageForm
                  branch={branch}
                  sections={sections}
                  inheritsSections={inheritsSections}
                  mode="identity"
                />{" "}
                <MediaUploadField
                  entityType="branch"
                  entityId={branch.id}
                  label={`Logo profil ${branch.name}`}
                  previewUrl={assetUrl(branch.logoPath)}
                />{" "}
              </div>{" "}
            </FormDialog>
          ),
          sections: (
            <FormDialog
              title={`Tampilan & susunan ${branch.name}`}
              triggerLabel="Atur tampilan & susunan halaman"
              refreshBuilderData
              dataTool="sections"
            >
              {" "}
              <BranchPageForm
                branch={branch}
                sections={sections}
                inheritsSections={inheritsSections}
                hasCustomLayout
                mode="sections"
              />{" "}
            </FormDialog>
          ),
          campaigns: (
            <FormDialog
              title="Konten unggulan"
              triggerLabel="Atur konten unggulan"
              refreshBuilderData
              dataTool="campaigns"
            >
              {" "}
              <PageCampaigns rows={campaigns} branchId={branch.id} />{" "}
            </FormDialog>
          ),
          gallery: (
            <FormDialog
              title="Galeri produk"
              triggerLabel="Atur galeri produk"
              refreshBuilderData
              dataTool="gallery"
            >
              {" "}
              <GalleryManager
                branchId={branch.id}
                items={gallery.flatMap((item) => {
                  const imageUrl = assetUrl(item.imagePath);
                  return imageUrl ? [{ ...item, imageUrl }] : [];
                })}
              />{" "}
            </FormDialog>
          ),
          cta: (
            <FormDialog
              title="Tombol WhatsApp"
              triggerLabel="Atur CTA WhatsApp"
              refreshBuilderData
              dataTool="cta"
            >
              {" "}
              <BranchProductManager
                branchId={branch.id}
                products={products}
                hasCustomLayout
                canManageMeta={isTechnicalAdmin}
              />{" "}
            </FormDialog>
          ),
          reviews: (
            <FormDialog
              title="Ulasan Google"
              triggerLabel="Atur ulasan Google"
              refreshBuilderData
              dataTool="reviews"
            >
              {" "}
              <GoogleReviewManager
                key={[
                  reviewSource?.updatedAt.getTime() ?? "new",
                  ...reviews.map((review) =>
                    [review.id, review.updatedAt.getTime()].join("-"),
                  ),
                ].join(":")}
                branchId={branch.id}
                source={reviewSource}
                reviews={reviews}
                canScrape={isTechnicalAdmin}
              />{" "}
            </FormDialog>
          ),
          faq: (
            <FormDialog
              title="FAQ"
              triggerLabel="Atur FAQ"
              refreshBuilderData
              dataTool="faq"
            >
              {" "}
              <FaqManager
                faqs={faqs}
                branchId={branch.id}
                inherits={inheritsFaqs}
              />{" "}
            </FormDialog>
          ),
          links: (
            <FormDialog
              title="Tautan & media sosial"
              triggerLabel="Atur tautan & sosial"
              refreshBuilderData
              dataTool="links"
            >
              {" "}
              <PageLinks
                rows={links}
                branchId={branch.id}
                hasCustomLayout
                canManageMeta={isTechnicalAdmin}
              />{" "}
            </FormDialog>
          ),
          formResponses: (
            <Link
              href={`/admin/form-responses?branchId=${branch.id}`}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-card px-5 text-sm font-bold hover:border-[var(--kgj-accent)] hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {" "}
              Respons form{" "}
            </Link>
          ),
          tracking: (
            <FormDialog
              title="Meta Pixel & CAPI"
              triggerLabel="Atur Tracking Meta"
              refreshBuilderData
              dataTool="tracking"
            >
              {" "}
              <BranchMetaTrackingManager
                branchId={branch.id}
                settings={{
                  ...metaTracking,
                  capiAccessToken: metaSecrets?.capiAccessToken ?? null,
                  capiTestEventCode: metaSecrets?.capiTestEventCode ?? null,
                }}
                canManage={isTechnicalAdmin}
              />{" "}
            </FormDialog>
          ),
        }}
        preview={
          <PagePreview pageId={branch.id} title={branch.name} embedded />
        }
      />{" "}
    </div>
  );
}
