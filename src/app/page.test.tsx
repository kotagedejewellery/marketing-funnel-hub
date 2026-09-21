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
  products: [],
  links: [],
  sections: [
    { sectionKey: "brand_header" },
    { sectionKey: "products" },
    { sectionKey: "footer" },
  ],
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

  it("shows a product's active branch destination without requiring tracking", () => {
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
              imageUrl: null,
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
          ],
        }}
      />,
    );

    fireEvent.click(screen.getByText("Lihat cabang"));
    expect(screen.getByRole("link", { name: /whatsapp/i })).toHaveAttribute(
      "href",
      "https://wa.me/628123456789?text=Halo",
    );
  });
});

it("offers a retry without exposing database errors", () => {
  const reset = vi.fn();
  render(<PublicPageError reset={reset} />);

  expect(screen.getByText(/belum dapat dimuat/i)).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Coba lagi" }));
  expect(reset).toHaveBeenCalledOnce();
});
