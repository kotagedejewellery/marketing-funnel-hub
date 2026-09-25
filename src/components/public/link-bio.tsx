import type { PublicContent } from "@/modules/public-content/data";

import { GalleryCarousel } from "./gallery-carousel";
import { PublicImage } from "./public-image";
import { TrackingBehavior, type TrackingContext } from "./tracking-behavior";

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

function ReviewStars({ rating }: { rating: number }) {
  return (
    <span
      className="flex text-base leading-none text-amber-500"
      aria-hidden="true"
    >
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index}>{index < rating ? "★" : "☆"}</span>
      ))}
    </span>
  );
}

export function LinkBio({
  content,
  trackingContext = null,
  preview = false,
}: {
  content: PublicContent;
  trackingContext?: TrackingContext | null;
  preview?: boolean;
}) {
  const secondaryLinks = content.links.filter(
    (link) => link.linkType === "secondary",
  );
  const socialLinks = content.links.filter(
    (link) => link.linkType === "social",
  );
  const logoSection = content.sections.find(
    (section) => section.sectionKey === "profile_logo",
  );
  const sections = content.sections.filter(
    (section) => section.sectionKey !== "profile_logo",
  );
  const logoFallback = (
    <div className="flex size-24 shrink-0 items-center justify-center rounded-full bg-[var(--kgj-dark)] font-serif text-3xl font-bold text-[var(--kgj-accent-soft)]">
      KJ
    </div>
  );

  return (
    <main className="kgj-public mx-auto min-h-dvh w-full max-w-3xl px-4 pt-6 pb-10 text-foreground sm:px-6 sm:pt-8 sm:pb-12">
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
            })),
          }))}
          links={content.links.map((link) => ({
            id: link.id,
            label: link.label,
            type: link.linkType as "secondary" | "social",
          }))}
          branch={content.pageBranch}
        />
      )}
      {logoSection && (
        <section className="flex justify-center px-3" aria-label="Logo profil">
          {content.site.logoUrl ? (
            <PublicImage
              src={content.site.logoUrl}
              alt={`Logo ${content.site.siteName}`}
              width={192}
              height={192}
              sizes="96px"
              className="size-24 rounded-full bg-card object-contain p-2 shadow-[0_12px_28px_-18px_rgba(40,33,28,0.55)]"
              unoptimized={bypassImageOptimization(content.site.logoUrl)}
              fallback={logoFallback}
            />
          ) : (
            logoFallback
          )}
        </section>
      )}
      <div id="main-content" className="space-y-10 sm:space-y-14">
        {sections.map(({ sectionKey, publicTitle }) => {
          switch (sectionKey) {
            case "brand_header":
              return (
                <section
                  key={sectionKey}
                  className="flex flex-col items-center px-3 text-center"
                >
                  <h1 className="max-w-xl font-serif text-3xl leading-tight font-bold tracking-[-0.025em] text-balance break-words sm:text-4xl">
                    {content.site.siteName}
                  </h1>
                  {content.site.headline && (
                    <p className="mt-3 max-w-xl text-base leading-7 font-semibold text-balance">
                      {content.site.headline}
                    </p>
                  )}
                  {content.site.introduction && (
                    <p className="mt-2 max-w-2xl text-sm leading-6 whitespace-pre-line text-muted-foreground sm:text-base sm:leading-7">
                      {content.site.introduction}
                    </p>
                  )}
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
                  unoptimized={bypassImageOptimization(
                    content.campaign.bannerUrl,
                  )}
                />
              );

              return (
                <section
                  key={sectionKey}
                  className="overflow-hidden rounded-2xl bg-card"
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
              const visibleGallery = content.gallery.slice(0, 6);
              const remainingGallery = content.gallery.slice(6);
              const galleryClass = (itemCount: number) => {
                if (itemCount === 1) {
                  return "mx-auto grid max-w-sm grid-cols-1 gap-3 sm:gap-4";
                }
                if (itemCount === 2) {
                  return "-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto overscroll-x-contain px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0";
                }
                return "-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto overscroll-x-contain px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0";
              };
              const galleryImageSizes = (itemCount: number) => {
                if (itemCount === 1) {
                  return "(min-width: 640px) 384px, calc(100vw - 32px)";
                }
                if (itemCount === 2) {
                  return "(min-width: 768px) 352px, calc((100vw - 44px) / 2)";
                }
                return "(min-width: 640px) 224px, 82vw";
              };
              const renderGalleryItems = (items: typeof content.gallery) =>
                items.map((item) => (
                  <li
                    key={item.id}
                    className={
                      items.length >= 3
                        ? "w-[82%] shrink-0 snap-start sm:w-auto"
                        : items.length === 2
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
                        sizes={galleryImageSizes(items.length)}
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
                  key={sectionKey}
                  aria-labelledby={publicTitle ? "gallery-title" : undefined}
                  className="scroll-mt-6"
                >
                  {publicTitle && (
                    <h2
                      id="gallery-title"
                      className="text-center font-serif text-3xl leading-tight font-bold text-balance sm:text-4xl"
                    >
                      {publicTitle}
                    </h2>
                  )}
                  {visibleGallery.length >= 2 && (
                    <p
                      id="gallery-swipe-hint"
                      className="mt-2 text-center text-xs text-muted-foreground sm:hidden"
                    >
                      Geser untuk melihat koleksi lainnya atau tunggu koleksi
                      berikutnya.
                    </p>
                  )}
                  <GalleryCarousel
                    aria-label="Galeri produk"
                    aria-describedby={
                      visibleGallery.length >= 2
                        ? "gallery-swipe-hint"
                        : undefined
                    }
                    tabIndex={visibleGallery.length >= 2 ? 0 : undefined}
                    itemCount={visibleGallery.length}
                    className={`${publicTitle || visibleGallery.length >= 2 ? "mt-5" : "mt-0"} ${visibleGallery.length >= 2 ? "focus-visible:outline-2 focus-visible:outline-offset-2" : ""} ${galleryClass(visibleGallery.length)}`}
                  >
                    {renderGalleryItems(visibleGallery)}
                  </GalleryCarousel>
                  {remainingGallery.length > 0 && (
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
                        tabIndex={remainingGallery.length >= 2 ? 0 : undefined}
                        itemCount={remainingGallery.length}
                        className={`mt-5 ${remainingGallery.length >= 2 ? "focus-visible:outline-2 focus-visible:outline-offset-2" : ""} ${galleryClass(remainingGallery.length)}`}
                      >
                        {renderGalleryItems(remainingGallery)}
                      </GalleryCarousel>
                    </details>
                  )}
                </section>
              );
            }

            case "products":
              return (
                <section
                  key={sectionKey}
                  aria-labelledby={publicTitle ? "products-title" : undefined}
                  className="scroll-mt-6"
                >
                  {publicTitle && (
                    <h2
                      id="products-title"
                      className="text-center font-serif text-3xl leading-tight font-bold text-balance sm:text-4xl"
                    >
                      {publicTitle}
                    </h2>
                  )}
                  {content.products.length === 0 ? (
                    <p
                      role="status"
                      className={`${publicTitle ? "mt-6" : ""} rounded-2xl bg-card px-6 py-10 leading-7 text-muted-foreground`}
                    >
                      Pilihan produk belum tersedia. Silakan kembali lagi nanti.
                    </p>
                  ) : (
                    <>
                      <ul className={`${publicTitle ? "mt-6" : ""} space-y-3`}>
                        {content.products.map((product) => {
                          const destination = product.branches[0];
                          return (
                            <li key={product.id}>
                              <article data-track-product-id={product.id}>
                                {destination ? (
                                  <a
                                    href={destination.whatsappUrl}
                                    data-track="whatsapp"
                                    data-track-branch-id={destination.id}
                                    className="group flex min-h-20 w-full items-center gap-4 rounded-2xl bg-[var(--kgj-dark)] px-5 py-4 text-[var(--primary-foreground)] shadow-[0_12px_26px_-18px_rgba(40,33,28,0.65)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none"
                                    aria-label={`${destination.ctaLabel}, WhatsApp ${content.pageBranch.name}`}
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
                                    <h3 className="font-serif text-lg font-bold">
                                      {product.name}
                                    </h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                      Kontak cabang belum tersedia.
                                    </p>
                                  </div>
                                )}
                              </article>
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  )}
                </section>
              );

            case "secondary_links":
            case "social_links": {
              const sectionLinks =
                sectionKey === "social_links" ? socialLinks : secondaryLinks;
              if (sectionLinks.length === 0) return null;
              return (
                <section
                  key={sectionKey}
                  aria-labelledby={
                    publicTitle ? `${sectionKey}-title` : undefined
                  }
                >
                  {publicTitle && (
                    <h2
                      id={`${sectionKey}-title`}
                      className="font-serif text-3xl font-bold text-balance sm:text-4xl"
                    >
                      {publicTitle}
                    </h2>
                  )}
                  <ul
                    className={`${publicTitle ? "mt-5" : ""} grid gap-3 sm:grid-cols-2`}
                  >
                    {sectionLinks.map((link) => (
                      <li key={link.id}>
                        <a
                          href={link.url}
                          data-track="link"
                          data-track-link-id={link.id}
                          className="flex min-h-16 items-center gap-4 rounded-2xl bg-card px-5 py-3 font-bold transition-colors hover:bg-[var(--kgj-accent-soft)] focus-visible:outline-2 focus-visible:outline-offset-2"
                        >
                          <span className="min-w-0 break-words">
                            {link.label}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            }

            case "google_reviews":
              return content.reviews?.items.length ? (
                <section
                  key={sectionKey}
                  aria-labelledby={
                    publicTitle ? "google-reviews-title" : undefined
                  }
                >
                  {publicTitle && (
                    <h2
                      id="google-reviews-title"
                      className="font-serif text-3xl font-bold text-balance sm:text-4xl"
                    >
                      {publicTitle}
                    </h2>
                  )}
                  <ul className={`${publicTitle ? "mt-5" : ""} space-y-3`}>
                    {content.reviews.items.map((review) => {
                      const avatarFallback = (
                        <span
                          aria-hidden="true"
                          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--kgj-accent-soft)] font-serif font-bold text-[var(--kgj-dark)]"
                        >
                          {review.reviewerName.slice(0, 1).toUpperCase()}
                        </span>
                      );
                      return (
                        <li key={review.id}>
                          <article className="rounded-2xl bg-card px-5 py-5 shadow-[0_12px_28px_-22px_rgba(40,33,28,0.45)] sm:px-6">
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
                                  fallback={avatarFallback}
                                />
                              ) : (
                                avatarFallback
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
                              <ReviewStars rating={review.rating} />
                              <span className="text-xs text-muted-foreground">
                                {review.relativeTime}
                              </span>
                            </div>
                            <p className="mt-2 leading-7 whitespace-pre-line">
                              {review.reviewText}
                            </p>
                          </article>
                        </li>
                      );
                    })}
                  </ul>
                  <a
                    href={content.reviews.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--kgj-accent)] underline underline-offset-4 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    Lihat di Google Maps
                  </a>
                </section>
              ) : null;

            case "faq":
              return content.faqs.length ? (
                <section
                  key={sectionKey}
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
                  key={sectionKey}
                  className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-8 text-sm text-muted-foreground"
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

            default:
              return null;
          }
        })}
      </div>
    </main>
  );
}
