import type { PublicContent } from "@/modules/public-content/data";
import type { ConsentChoice } from "@/modules/tracking/consent";

import { ConsentControl } from "./consent-control";
import { PublicImage } from "./public-image";
import { TrackingBehavior, type TrackingContext } from "./tracking-behavior";

function bypassImageOptimization(url: string) {
  return (
    process.env.NEXT_PUBLIC_APP_ENV === "local" ||
    url.toLowerCase().endsWith(".svg")
  );
}

export function LinkBio({
  content,
  initialConsent = null,
  trackingContext = null,
}: {
  content: PublicContent;
  initialConsent?: ConsentChoice | null;
  trackingContext?: TrackingContext | null;
}) {
  const secondaryLinks = content.links.filter(
    (link) => link.linkType === "secondary",
  );
  const socialLinks = content.links.filter(
    (link) => link.linkType === "social",
  );
  const hasProducts =
    content.products.length > 0 &&
    content.sections.some((section) => section.sectionKey === "products");
  const hasBrandContent = Boolean(
    content.site.headline || content.site.introduction || content.site.logoUrl,
  );
  const logoFallback = (
    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--kgj-dark)] font-serif text-xl font-bold text-[var(--kgj-accent-soft)]">
      KJ
    </div>
  );

  return (
    <main className="kgj-public mx-auto min-h-dvh w-full max-w-6xl px-4 pb-8 text-foreground sm:px-6 lg:px-8">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-10 focus:bg-background focus:p-3 focus:outline-2 focus:outline-offset-2"
      >
        Lewati ke konten
      </a>

      <header className="flex items-center justify-between gap-4 py-5 sm:py-7">
        <div className="flex min-w-0 items-center gap-3">
          {content.site.logoUrl ? (
            <PublicImage
              src={content.site.logoUrl}
              alt={`Logo ${content.site.siteName}`}
              width={88}
              height={88}
              className="size-12 shrink-0 rounded-2xl object-contain"
              unoptimized={bypassImageOptimization(content.site.logoUrl)}
              fallback={logoFallback}
            />
          ) : (
            logoFallback
          )}
          <p className="min-w-0 max-w-56 font-serif text-base font-bold leading-tight break-words sm:text-lg">
            {content.site.siteName}
          </p>
        </div>
        {hasProducts && (
          <a
            href="#products-title"
            className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-card px-4 text-xs font-bold shadow-[0_8px_24px_-18px_rgba(40,33,28,0.5)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none sm:text-sm"
          >
            Lihat produk
          </a>
        )}
      </header>

      <h1 className="sr-only">{content.site.siteName}</h1>
      <ConsentControl initialChoice={initialConsent} />
      {trackingContext && (
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
        />
      )}
      <div id="main-content">
        {content.sections.map(({ sectionKey }) => {
          switch (sectionKey) {
            case "brand_header":
              return (
                <section
                  key={sectionKey}
                  className={`grid overflow-hidden rounded-2xl bg-[var(--kgj-dark)] text-[var(--primary-foreground)] ${content.site.logoUrl ? "md:grid-cols-[minmax(0,1.25fr)_minmax(15rem,0.75fr)]" : ""}`}
                >
                  <div className={`flex flex-col justify-center px-6 sm:px-10 lg:px-14 ${hasBrandContent ? "py-10 sm:py-16" : "py-7 sm:py-10"}`}>
                    <h2 className="max-w-2xl font-serif text-[clamp(2.4rem,6vw,5rem)] leading-[1.05] font-bold tracking-[-0.035em] text-balance break-words">
                      {content.site.headline || content.site.siteName}
                    </h2>
                    {content.site.introduction && (
                      <p className="mt-6 max-w-xl text-base leading-7 text-[var(--kgj-on-dark-muted)] sm:text-lg sm:leading-8">
                        {content.site.introduction}
                      </p>
                    )}
                    {hasProducts && (
                      <a
                        href="#products-title"
                        className="mt-8 inline-flex min-h-12 w-fit items-center rounded-full bg-[var(--kgj-accent-soft)] px-6 text-sm font-bold text-[var(--kgj-dark)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--kgj-accent-soft)] motion-reduce:transition-none"
                      >
                        Jelajahi produk
                      </a>
                    )}
                  </div>
                  {content.site.logoUrl && (
                    <div className="flex min-h-56 items-center justify-center bg-[var(--kgj-accent-soft)] px-8 py-8 text-[var(--kgj-dark)] md:min-h-96">
                      <PublicImage
                        src={content.site.logoUrl}
                        alt=""
                        width={400}
                        height={400}
                        sizes="(min-width: 768px) 330px, 220px"
                        className="max-h-72 w-full max-w-72 object-contain"
                        unoptimized={bypassImageOptimization(content.site.logoUrl)}
                        fallback={<span aria-hidden="true" className="font-serif text-8xl font-bold">KJ</span>}
                      />
                    </div>
                  )}
                </section>
              );

            case "campaign_banner":
              return content.campaign ? (
                <section
                  key={sectionKey}
                  className="mt-4 overflow-hidden rounded-2xl bg-card sm:mt-5"
                >
                  <div className={content.campaign.bannerUrl ? "grid md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]" : ""}>
                    {content.campaign.bannerUrl && (
                      <PublicImage
                        src={content.campaign.bannerUrl}
                        alt={content.campaign.title || "Banner kampanye KGJ"}
                        width={1200}
                        height={600}
                        sizes="(min-width: 768px) 520px, calc(100vw - 32px)"
                        className="aspect-[4/3] h-full w-full object-cover"
                        unoptimized={bypassImageOptimization(
                          content.campaign.bannerUrl,
                        )}
                      />
                    )}
                    <div className="flex flex-col justify-center p-6 sm:p-10">
                      <h2 className="font-serif text-3xl leading-tight font-bold break-words sm:text-4xl">
                        {content.campaign.title || "Informasi terbaru"}
                      </h2>
                      {content.campaign.description && (
                        <p className="mt-3 max-w-xl leading-7 text-muted-foreground">
                          {content.campaign.description}
                        </p>
                      )}
                      {content.campaign.targetUrl && (
                        <a
                          className="mt-6 inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-[var(--kgj-dark)] px-5 font-bold text-[var(--primary-foreground)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none"
                          href={content.campaign.targetUrl}
                        >
                          Lihat detail
                        </a>
                      )}
                    </div>
                  </div>
                </section>
              ) : null;

            case "products":
              return (
                <section
                  key={sectionKey}
                  aria-labelledby="products-title"
                  className="py-12 sm:py-16"
                >
                  <h2
                    id="products-title"
                    className="scroll-mt-6 font-serif text-4xl leading-tight font-bold text-balance sm:text-5xl"
                  >
                    Temukan yang Anda cari
                  </h2>
                  {content.products.length === 0 ? (
                    <p
                      role="status"
                      className="mt-8 rounded-2xl bg-card px-6 py-10 leading-7 text-muted-foreground"
                    >
                      Pilihan produk belum tersedia. Silakan kembali lagi nanti.
                    </p>
                  ) : (
                    <div className="mt-8 grid gap-4 md:grid-cols-2 sm:gap-5">
                      {content.products.map((product, index) => (
                        <article
                          key={product.id}
                          className={`grid min-w-0 gap-6 overflow-hidden rounded-2xl p-5 sm:p-7 ${index === 0 ? "bg-[var(--kgj-accent-soft)] md:col-span-2" : "bg-card"} ${index === 0 && product.imageUrl ? "md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-center" : ""}`}
                        >
                          {product.imageUrl && (
                            <div className="min-w-0 overflow-hidden rounded-xl bg-secondary">
                              <PublicImage
                                src={product.imageUrl}
                                alt={product.name}
                                width={720}
                                height={540}
                                sizes="(min-width: 768px) 500px, calc(100vw - 72px)"
                                className="aspect-[4/3] w-full object-cover"
                                unoptimized={bypassImageOptimization(
                                  product.imageUrl,
                                )}
                                fallback={
                                  <p className="p-5 text-sm text-muted-foreground">
                                    Gambar {product.name} belum tersedia.
                                  </p>
                                }
                              />
                            </div>
                          )}
                          <div className="min-w-0 self-center">
                            <h3 className="font-serif text-3xl leading-tight font-bold text-balance break-words sm:text-4xl">
                              {product.name}
                            </h3>
                            {product.description && (
                              <p className="mt-3 max-w-lg leading-7 text-muted-foreground">
                                {product.description}
                              </p>
                            )}
                            {product.branches.length === 0 ? (
                              <p className="mt-6 border-t border-border pt-4 text-sm text-muted-foreground">
                                Cabang untuk produk ini belum tersedia.
                              </p>
                            ) : (
                              <details
                                data-track-product-id={product.id}
                                className="group mt-6 border-t border-border"
                              >
                                <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-4 py-3 font-bold text-foreground transition-colors hover:text-[var(--kgj-accent)] focus-visible:outline-2 focus-visible:outline-offset-2">
                                  <span>Lihat cabang</span>
                                  <svg
                                    aria-hidden="true"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    className="size-5 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                                  >
                                    <path d="m6 9 6 6 6-6" />
                                  </svg>
                                </summary>
                                <ul className="border-t border-border">
                                  {product.branches.map((branch) => (
                                    <li
                                      key={branch.id}
                                      className="grid min-w-0 gap-3 border-b border-border py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                                    >
                                      <span className="min-w-0 font-medium break-words">
                                        {branch.name}
                                      </span>
                                      <a
                                        href={branch.whatsappUrl}
                                        data-track-branch-id={branch.id}
                                        className="inline-flex min-h-12 min-w-0 items-center justify-center rounded-full bg-primary px-5 py-2 text-center text-sm font-bold break-words text-primary-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none"
                                        aria-label={`${branch.ctaLabel}, ${branch.name}`}
                                      >
                                        {branch.ctaLabel}
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              </details>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
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
                  className="pb-10 sm:pb-12"
                >
                  <h2 className="mb-5 font-serif text-3xl font-bold">
                    {sectionKey === "social_links"
                      ? "Temukan kami"
                      : "Tautan lainnya"}
                  </h2>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {sectionLinks.map((link) => (
                      <li key={link.id}>
                        <a
                          href={link.url}
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

            case "footer":
              return (
                <footer
                  key={sectionKey}
                  className="flex flex-wrap items-center justify-between gap-3 border-t border-border py-8 text-sm text-muted-foreground"
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
