import type { PublicContent } from "@/modules/public-content/data";
import {
  pageBuilderBlocksSchema,
  sanitizePageBuilderHtml,
  type PageBuilderBlock,
} from "@/modules/page-builder/schema";

import { GalleryCarousel } from "./gallery-carousel";
import { PublicImage } from "./public-image";
import { ReviewCarousel } from "./review-carousel";
import { TrackingBehavior, type TrackingContext } from "./tracking-behavior";
import { BuilderForm } from "./builder-form";

function sectionLayoutClass(spacingAfter: string, showDivider: boolean) {
  const spacing = {
    compact: "mb-6 sm:mb-8",
    normal: "mb-10 sm:mb-14",
    relaxed: "mb-14 sm:mb-20",
  };
  return `${spacing[spacingAfter as keyof typeof spacing] ?? spacing.normal} ${showDivider ? "border-b border-border pb-6 sm:pb-8" : ""}`;
}

function bypassImageOptimization(url: string) {
  return (
    process.env.NEXT_PUBLIC_APP_ENV === "local" ||
    url.toLowerCase().endsWith(".svg")
  );
}

function WhatsAppIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-7 shrink-0"
      fill="currentColor"
    >
      <path d="M12.04 2a9.83 9.83 0 0 0-8.5 14.75L2 22l5.39-1.41A9.95 9.95 0 1 0 12.04 2Zm0 17.98a8.1 8.1 0 0 1-4.13-1.13l-.3-.18-3.2.84.86-3.12-.2-.32a8.04 8.04 0 1 1 6.97 3.91Zm4.42-6.03c-.24-.12-1.43-.7-1.65-.79-.22-.08-.38-.12-.55.12-.16.25-.62.79-.76.95-.14.17-.28.19-.52.07-.24-.12-1.02-.38-1.94-1.2a7.2 7.2 0 0 1-1.34-1.67c-.14-.24-.01-.37.1-.49.1-.1.24-.28.36-.42.12-.14.16-.24.24-.4.08-.17.04-.31-.02-.43-.06-.12-.54-1.3-.75-1.79-.2-.47-.4-.4-.54-.41h-.47c-.16 0-.43.06-.65.3-.22.25-.85.83-.85 2.02 0 1.2.87 2.35.99 2.51.12.17 1.71 2.62 4.15 3.67.58.25 1.03.4 1.38.51.58.19 1.11.16 1.53.1.47-.07 1.43-.59 1.64-1.16.2-.58.2-1.07.14-1.17-.06-.1-.22-.16-.46-.28Z" />
    </svg>
  );
}

function ProductCta({
  product,
  branchName,
}: {
  product: PublicContent["products"][number];
  branchName: string;
}) {
  const destination = product.branches[0];
  return (
    <article data-track-product-id={product.id}>
      {destination ? (
        <a
          href={destination.whatsappUrl}
          data-track="whatsapp"
          data-track-branch-id={destination.id}
          className="group flex min-h-20 w-full items-center gap-4 rounded-2xl bg-[#0e0d0d] px-5 py-4 text-[var(--primary-foreground)] shadow-[0_12px_26px_-18px_rgba(40,33,28,0.65)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none"
          aria-label={`${destination.ctaLabel}, WhatsApp ${branchName}`}
        >
          <WhatsAppIcon />
          <div className="min-w-0 flex-1 text-center">
            <h3 className="font-serif text-base leading-snug font-bold break-words sm:text-lg">
              {product.name}
            </h3>
            {product.description && (
              <p className="mt-1 text-xs leading-5 whitespace-pre-line text-[var(--kgj-on-dark-muted)] sm:text-sm">
                {product.description}
              </p>
            )}
            <p className="mt-1 text-xs font-bold text-[var(--kgj-accent-soft)]">
              {destination.ctaLabel}
            </p>
          </div>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-5 shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </a>
      ) : (
        <div className="rounded-2xl bg-card px-5 py-5">
          <h3 className="font-serif text-lg font-bold">{product.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Kontak cabang belum tersedia.
          </p>
        </div>
      )}
    </article>
  );
}

function CustomLinkIcon({ iconKey }: { iconKey: string | null }) {
  if (!iconKey) return null;
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconKey === "catalog" ? (
        <>
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" />
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 8H20" />
        </>
      ) : iconKey === "calendar" ? (
        <>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 10h18" />
        </>
      ) : (
        <path d="m9 18 6-6-6-6" />
      )}
    </svg>
  );
}

function LinkCta({ link }: { link: PublicContent["links"][number] }) {
  const primary = link.linkType === "cta";
  const customClass =
    link.buttonStyle === "outline"
      ? "border border-foreground bg-background text-foreground hover:bg-secondary"
      : link.buttonStyle === "soft"
        ? "bg-[var(--kgj-accent-soft)] text-foreground hover:bg-[var(--kgj-accent)]"
        : "bg-[#0e0d0d] text-[var(--primary-foreground)] shadow-[0_12px_26px_-18px_rgba(40,33,28,0.65)] hover:-translate-y-0.5";
  return (
    <a
      href={link.url}
      data-track="link"
      data-track-link-id={link.id}
      className={
        primary
          ? `group flex min-h-16 items-center gap-4 rounded-2xl px-5 py-3 font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none ${customClass}`
          : "flex min-h-16 items-center gap-4 rounded-2xl bg-card px-5 py-3 font-bold transition-colors hover:bg-[var(--kgj-accent-soft)] focus-visible:outline-2 focus-visible:outline-offset-2"
      }
    >
      {primary && <CustomLinkIcon iconKey={link.iconKey} />}
      <span className="min-w-0 flex-1 break-words">{link.label}</span>
    </a>
  );
}

function BuilderSection({
  content,
  section,
}: {
  content: PublicContent;
  section: PublicContent["sections"][number];
}) {
  const layoutClass = sectionLayoutClass(
    section.spacingAfter,
    section.showDivider,
  );
  const { publicTitle, sectionKey } = section;

  switch (sectionKey) {
    case "profile_logo": {
      const fallback = (
        <div className="flex size-24 shrink-0 items-center justify-center rounded-full bg-[var(--kgj-dark)] font-serif text-3xl font-bold text-[var(--kgj-accent-soft)]">
          KJ
        </div>
      );
      return (
        <section
          className={`flex justify-center px-3 ${layoutClass}`}
          aria-label="Logo profil"
        >
          {content.site.logoUrl ? (
            <PublicImage
              src={content.site.logoUrl}
              alt={`Logo ${content.site.siteName}`}
              width={192}
              height={192}
              sizes="96px"
              className="size-24 rounded-full bg-card object-contain p-2 shadow-[0_12px_28px_-18px_rgba(40,33,28,0.55)]"
              unoptimized={bypassImageOptimization(content.site.logoUrl)}
              fallback={fallback}
            />
          ) : (
            fallback
          )}
        </section>
      );
    }
    case "brand_header":
      if (
        !content.site.showProfileName &&
        !(content.site.showHeadline && content.site.headline) &&
        !(content.site.showIntroduction && content.site.introduction)
      ) {
        return null;
      }
      return (
        <section
          className={`flex flex-col items-center px-3 text-center ${layoutClass}`}
        >
          {content.site.showProfileName ? (
            <h1 className="max-w-xl font-serif text-3xl leading-tight font-bold tracking-[-0.025em] text-balance break-words sm:text-4xl">
              {content.site.siteName}
            </h1>
          ) : null}
          {content.site.showHeadline && content.site.headline ? (
            <p className="mt-3 max-w-xl text-base leading-7 font-semibold text-balance">
              {content.site.headline}
            </p>
          ) : null}
          {content.site.showIntroduction && content.site.introduction ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 whitespace-pre-line text-muted-foreground sm:text-base sm:leading-7">
              {content.site.introduction}
            </p>
          ) : null}
        </section>
      );
    case "campaign_banner": {
      if (!content.campaign?.bannerUrl) return null;
      const banner = (
        <PublicImage
          src={content.campaign.bannerUrl}
          alt={content.campaign.title || "Banner kampanye KGJ"}
          width={1080}
          height={1350}
          sizes="(min-width: 768px) 720px, calc(100vw - 32px)"
          className="aspect-[4/5] w-full object-cover"
          unoptimized={bypassImageOptimization(content.campaign.bannerUrl)}
        />
      );
      return (
        <section
          className={`overflow-hidden rounded-2xl bg-card ${layoutClass}`}
        >
          {content.campaign.targetUrl ? (
            <a
              href={content.campaign.targetUrl}
              className="block focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {banner}
            </a>
          ) : (
            banner
          )}
          {(content.campaign.title || content.campaign.description) && (
            <div className="px-5 py-5 sm:px-6 sm:py-6">
              {content.campaign.title && (
                <h2 className="font-serif text-2xl leading-tight font-bold text-balance sm:text-3xl">
                  {content.campaign.title}
                </h2>
              )}
              {content.campaign.description && (
                <p className="mt-2 leading-7 whitespace-pre-line text-muted-foreground">
                  {content.campaign.description}
                </p>
              )}
            </div>
          )}
        </section>
      );
    }
    case "gallery": {
      if (content.gallery.length === 0) return null;
      const visible = content.gallery.slice(0, 6);
      const remaining = content.gallery.slice(6);
      const galleryClass = (count: number) =>
        count === 1
          ? "mx-auto grid max-w-sm grid-cols-1 gap-3 sm:gap-4"
          : count === 2
            ? "flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:pb-0"
            : "flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:pb-0";
      const items = (rows: typeof content.gallery) =>
        rows.map((item) => (
          <li
            key={item.id}
            className={
              rows.length >= 2
                ? "w-[82%] shrink-0 snap-start sm:w-auto"
                : undefined
            }
          >
            <figure className="h-full overflow-hidden rounded-2xl bg-card">
              <PublicImage
                src={item.imageUrl}
                alt={item.altText}
                width={1080}
                height={1350}
                sizes="(min-width: 640px) 224px, 82vw"
                className="aspect-[4/5] w-full object-cover"
                unoptimized={bypassImageOptimization(item.imageUrl)}
              />
              {(item.title || item.description) && (
                <figcaption className="px-4 py-4">
                  {item.title && (
                    <h3 className="font-serif font-bold text-balance">
                      {item.title}
                    </h3>
                  )}
                  {item.description && (
                    <p className="mt-1 text-sm leading-6 whitespace-pre-line text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                </figcaption>
              )}
            </figure>
          </li>
        ));
      return (
        <section
          className={`scroll-mt-6 ${layoutClass}`}
          aria-labelledby={publicTitle ? "gallery-title" : undefined}
        >
          {publicTitle && (
            <h2
              id="gallery-title"
              className="text-center font-serif text-3xl leading-tight font-bold text-balance sm:text-4xl"
            >
              {publicTitle}
            </h2>
          )}
          <GalleryCarousel
            aria-label="Galeri produk"
            itemCount={visible.length}
            className={`${publicTitle ? "mt-5" : ""} ${galleryClass(visible.length)}`}
          >
            {items(visible)}
          </GalleryCarousel>
          {remaining.length > 0 && (
            <details className="group mt-5">
              <summary className="mx-auto flex min-h-11 w-fit cursor-pointer list-none items-center rounded-full border border-border bg-card px-5 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 [&::-webkit-details-marker]:hidden">
                <span className="group-open:hidden">
                  Lihat semua koleksi ({content.gallery.length})
                </span>
                <span className="hidden group-open:inline">
                  Sembunyikan koleksi tambahan
                </span>
              </summary>
              <GalleryCarousel
                aria-label="Galeri produk tambahan"
                itemCount={remaining.length}
                className={`mt-5 ${galleryClass(remaining.length)}`}
              >
                {items(remaining)}
              </GalleryCarousel>
            </details>
          )}
        </section>
      );
    }
    case "products":
    case "secondary_links":
    case "social_links":
      return publicTitle ? (
        <section
          className={layoutClass}
          aria-labelledby={`${sectionKey}-title`}
        >
          <h2
            id={`${sectionKey}-title`}
            className="font-serif text-3xl font-bold text-balance sm:text-4xl"
          >
            {publicTitle}
          </h2>
        </section>
      ) : null;
    case "google_reviews": {
      const reviews = content.reviews;
      if (!reviews?.items.length) return null;
      return (
        <section
          className={layoutClass}
          aria-labelledby={publicTitle ? "google-reviews-title" : undefined}
        >
          {publicTitle && (
            <h2
              id="google-reviews-title"
              className="font-serif text-3xl font-bold text-balance sm:text-4xl"
            >
              {publicTitle}
            </h2>
          )}
          <div className={publicTitle ? "mt-5" : ""}>
            <ReviewCarousel itemCount={reviews.items.length}>
              {reviews.items.map((review) => (
                <li
                  key={review.id}
                  className={
                    reviews.items.length > 1
                      ? "flex w-full shrink-0 snap-start"
                      : undefined
                  }
                >
                  <article className="flex h-full flex-1 flex-col rounded-2xl bg-card px-5 py-5 shadow-[0_12px_28px_-22px_rgba(40,33,28,0.45)] sm:px-6">
                    <div className="flex items-start gap-3">
                      {review.reviewerPhotoUrl ? (
                        <PublicImage
                          src={review.reviewerPhotoUrl}
                          alt=""
                          width={88}
                          height={88}
                          sizes="44px"
                          className="size-11 shrink-0 rounded-full bg-secondary object-cover"
                          unoptimized
                        />
                      ) : (
                        <span
                          aria-hidden="true"
                          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--kgj-accent-soft)] font-serif font-bold text-[var(--kgj-dark)]"
                        >
                          {review.reviewerName.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold break-words">
                          {review.reviewerName}
                        </p>
                        {review.reviewerReviewCount !== null && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {review.reviewerReviewCount} ulasan
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="sr-only">{`Rating ${review.rating} dari 5`}</span>
                      <span
                        className="text-base leading-none text-amber-500"
                        aria-hidden="true"
                      >
                        {"★".repeat(review.rating)}
                        {"☆".repeat(5 - review.rating)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {review.relativeTime}
                      </span>
                    </div>
                    <p className="mt-2 leading-7 whitespace-pre-line">
                      {review.reviewText}
                    </p>
                  </article>
                </li>
              ))}
            </ReviewCarousel>
          </div>
        </section>
      );
    }
    case "faq":
      return content.faqs.length ? (
        <section
          className={layoutClass}
          aria-labelledby={publicTitle ? "faq-title" : undefined}
        >
          {publicTitle && (
            <h2
              id="faq-title"
              className="font-serif text-3xl font-bold text-balance sm:text-4xl"
            >
              {publicTitle}
            </h2>
          )}
          <div
            className={`${publicTitle ? "mt-5" : ""} divide-y divide-border overflow-hidden rounded-2xl bg-card px-5 sm:px-8`}
          >
            {content.faqs.map((faq) => (
              <details key={faq.id} className="group py-2">
                <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-4 py-3 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2">
                  <span>{faq.question}</span>
                  <span
                    aria-hidden="true"
                    className="text-xl leading-none text-[var(--kgj-accent)] group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="max-w-3xl pb-5 leading-7 whitespace-pre-line text-muted-foreground">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      ) : null;
    case "footer":
      return (
        <footer
          className={`flex flex-wrap items-center justify-between gap-3 border-t border-border pt-8 text-sm text-muted-foreground ${layoutClass}`}
        >
          <span>{content.site.siteName}</span>
          {content.site.privacyUrl && (
            <a
              className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2"
              href={content.site.privacyUrl}
            >
              Privasi
            </a>
          )}
        </footer>
      );
  }
}

function FreeBlock({ block }: { block: PageBuilderBlock }) {
  if (block.type === "rich_text")
    return <p className="whitespace-pre-wrap leading-7">{block.text}</p>;
  if (block.type === "html")
    return (
      <div
        className="prose max-w-none"
        dangerouslySetInnerHTML={{
          __html: sanitizePageBuilderHtml(block.html),
        }}
      />
    );
  if (block.type === "image")
    return (
      <img
        src={block.url}
        alt={block.alt}
        className="w-full rounded-2xl object-cover"
      />
    );
  if (block.type === "spacer")
    return (
      <div
        aria-hidden="true"
        className="flex items-center"
        style={{
          height: `${block.spacingPx ?? legacySpacerPx(block.size)}px`,
          minHeight: block.showDivider ? "1px" : undefined,
        }}
      >
        {block.showDivider && (
          <hr className="m-0 w-full border-0 border-t border-border" />
        )}
      </div>
    );
  if (block.type === "embed")
    return (
      <iframe
        src={block.url}
        title="Embed YouTube"
        className="aspect-video w-full rounded-2xl border-0"
        sandbox="allow-scripts allow-presentation"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    );
  return null;
}

function legacySpacerPx(size: "sm" | "md" | "lg" | undefined) {
  return size === "sm" ? 16 : size === "lg" ? 64 : 32;
}

export function BuilderLinkBio({
  content,
  trackingContext,
  preview,
}: {
  content: PublicContent;
  trackingContext: TrackingContext | null;
  preview: boolean;
}) {
  const parsed = pageBuilderBlocksSchema.safeParse(content.builderBlocks);
  if (!parsed.success) return null;
  const products = new Map(
    content.products.map((item) => [item.assignmentId, item]),
  );
  const links = new Map(content.links.map((item) => [item.id, item]));
  const sections = new Map(
    content.sections.map((item) => [item.sectionKey, item]),
  );

  return (
    <main className="kgj-public relative min-h-dvh w-full text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-10 focus:bg-background focus:p-3 focus:outline-2 focus:outline-offset-2"
      >
        Lewati ke konten
      </a>
      {!preview && trackingContext && (
        <TrackingBehavior
          context={trackingContext}
          products={content.products.map((product) => ({
            id: product.id,
            slug: product.slug,
            branches: product.branches.map((branch) => ({
              id: branch.id,
              name: branch.name,
              metaEventName: branch.metaEventName,
            })),
          }))}
          links={content.links.map((link) => ({
            id: link.id,
            label: link.label,
            type: link.linkType as "secondary" | "social" | "cta",
            metaEventName: link.metaEventName,
          }))}
          branch={content.pageBranch}
          metaTracking={content.tracking}
        />
      )}
      <div
        id="main-content"
        className="kgj-public-content flex flex-wrap gap-x-4 px-4 pt-6 pb-10 sm:px-6 sm:pt-8 sm:pb-12"
      >
        {parsed.data
          .filter((block) => block.isVisible)
          .map((block) => {
            const wrapperClass =
              block.width === "half" ? "sm:w-[calc(50%-0.5rem)]" : "w-full";
            if (block.type === "product_cta") {
              const product = products.get(block.assignmentId);
              return product ? (
                <section
                  key={block.id}
                  className={`${wrapperClass} mb-6 sm:mb-8`}
                >
                  <ProductCta
                    product={product}
                    branchName={content.pageBranch.name}
                  />
                </section>
              ) : null;
            }
            if (block.type === "link") {
              const link = links.get(block.linkId);
              return link ? (
                <section
                  key={block.id}
                  className={`${wrapperClass} mb-6 sm:mb-8`}
                >
                  <LinkCta link={link} />
                </section>
              ) : null;
            }
            if (block.type === "section") {
              const section = sections.get(block.sectionKey);
              return section ? (
                <div key={block.id} className={wrapperClass}>
                  <BuilderSection content={content} section={section} />
                </div>
              ) : null;
            }
            if (block.type === "form") {
              const product = products.get(block.assignmentId);
              return product ? (
                <div key={block.id} className={`${wrapperClass} mb-6 sm:mb-8`}>
                  <BuilderForm
                    block={block}
                    branchSlug={content.pageBranch.slug}
                    product={product}
                  />
                </div>
              ) : null;
            }
            return (
              <div key={block.id} className={`${wrapperClass} mb-6 sm:mb-8`}>
                <FreeBlock block={block} />
              </div>
            );
          })}
      </div>
    </main>
  );
}
