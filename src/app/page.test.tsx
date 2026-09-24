import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import PublicPageError from "./error";
import { LinkBio } from "@/components/public/link-bio";
import type { PublicContent } from "@/modules/public-content/data";

const emptyContent: PublicContent = {
  site: {
    siteName: "KGJ",
    headline: null,
    introduction: null,
    logoUrl: null,
    privacyUrl: null,
  },
  campaign: null,
  gallery: [],
  reviews: null,
  products: [],
  links: [],
  faqs: [],
  sections: [
    { sectionKey: "brand_header", publicTitle: null },
    { sectionKey: "products", publicTitle: null },
    { sectionKey: "footer", publicTitle: null },
  ],
  pageBranch: { id: "branch-1", name: "Solo", slug: "solo" },
};

describe("public Link Bio", () => {
  it("shows an honest empty state when products have not been published", () => {
    render(<LinkBio content={emptyContent} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "KGJ" }),
    ).toBeVisible();
    expect(screen.getByText(/belum tersedia/i)).toBeVisible();
    expect(
      screen.queryByRole("link", { name: /whatsapp/i }),
    ).not.toBeInTheDocument();
  });

  it("shows multiple branch products with direct WhatsApp links", () => {
    render(
      <LinkBio
        content={{
          ...emptyContent,
          products: [
            {
              id: "product-1",
              name: "Wedding Ring",
              slug: "wedding-ring",
              description: "Cincin custom",
              branches: [
                {
                  id: "branch-1",
                  name: "Solo",
                  slug: "solo",
                  ctaLabel: "Hubungi via WhatsApp",
                  whatsappUrl: "https://wa.me/628123456789?text=Halo",
                },
              ],
            },
            {
              id: "product-2",
              name: "Nusantara Series",
              slug: "nusantara-series",
              description: "Cincin motif Nusantara",
              branches: [
                {
                  id: "branch-1",
                  name: "Solo",
                  slug: "solo",
                  ctaLabel: "Konsultasi Nusantara",
                  whatsappUrl: "https://wa.me/628123456789?text=Nusantara",
                },
              ],
            },
          ],
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Wedding Ring" })).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Nusantara Series" }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", {
        name: /Hubungi via WhatsApp, WhatsApp Solo/i,
      }),
    ).toHaveAttribute("href", "https://wa.me/628123456789?text=Halo");
    expect(
      screen.getByRole("link", {
        name: /Konsultasi Nusantara, WhatsApp Solo/i,
      }),
    ).toHaveAttribute("href", "https://wa.me/628123456789?text=Nusantara");
  });

  it("shows gallery images independently from WhatsApp products", () => {
    render(
      <LinkBio
        content={{
          ...emptyContent,
          gallery: [
            {
              id: "gallery-1",
              title: "Koleksi Favorit",
              description: "Detail cincin bertekstur",
              altText: "Sepasang cincin nikah bertekstur",
              imageUrl: "/favorite.jpg",
            },
          ],
          sections: [{ sectionKey: "gallery", publicTitle: null }],
        }}
      />,
    );

    expect(
      screen.getByRole("img", { name: "Sepasang cincin nikah bertekstur" }),
    ).toHaveAttribute("src");
    expect(screen.getByText("Koleksi Favorit")).toBeVisible();
    expect(
      screen.queryByRole("link", { name: /WhatsApp/i }),
    ).not.toBeInTheDocument();
  });

  it("shows campaign artwork with its own title and description", () => {
    render(
      <LinkBio
        content={{
          ...emptyContent,
          campaign: {
            id: "campaign-1",
            title: "Promo September",
            description: "Penawaran khusus bulan ini",
            bannerUrl: "/promo-september.jpg",
            targetUrl: "https://example.com/promo",
          },
          sections: [{ sectionKey: "campaign_banner", publicTitle: null }],
        }}
      />,
    );

    const banner = screen.getByRole("img", { name: "Promo September" });
    expect(banner).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Promo September" }),
    ).toBeVisible();
    expect(screen.getByText("Penawaran khusus bulan ini")).toBeVisible();
    expect(banner.closest("a")).toHaveAttribute(
      "href",
      "https://example.com/promo",
    );
  });

  it("shows only selected Google reviews supplied by the public loader", () => {
    render(
      <LinkBio
        content={{
          ...emptyContent,
          reviews: {
            sourceUrl: "https://maps.google.com/maps/place/KGJ",
            items: [
              {
                id: "review-1",
                reviewerName: "Maria Prasasti",
                reviewerPhotoUrl: null,
                reviewerReviewCount: 1,
                rating: 5,
                relativeTime: "6 hari lalu",
                reviewText: "Pelayanan sangat memuaskan.",
              },
            ],
          },
          sections: [
            { sectionKey: "google_reviews", publicTitle: "Review kami" },
          ],
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Review kami" })).toBeVisible();
    expect(screen.getByText("Maria Prasasti")).toBeVisible();
    expect(screen.getByText("Pelayanan sangat memuaskan.")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Lihat di Google Maps" }),
    ).toHaveAttribute("href", "https://maps.google.com/maps/place/KGJ");
  });
});

it("offers a retry without exposing database errors", () => {
  const reset = vi.fn();
  render(<PublicPageError reset={reset} />);

  expect(screen.getByText(/belum dapat dimuat/i)).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Coba lagi" }));
  expect(reset).toHaveBeenCalledOnce();
});
