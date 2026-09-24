import * as z from "zod";

export const branchSectionKeys = [
  "profile_logo",
  "brand_header",
  "campaign_banner",
  "gallery",
  "products",
  "google_reviews",
  "faq",
  "secondary_links",
  "social_links",
  "footer",
] as const;

export const branchSectionLabels: Record<
  (typeof branchSectionKeys)[number],
  string
> = {
  profile_logo: "Logo profil",
  brand_header: "Profil",
  campaign_banner: "Konten unggulan",
  gallery: "Galeri Produk",
  products: "Tombol WhatsApp",
  google_reviews: "Ulasan Google",
  faq: "FAQ",
  secondary_links: "Tautan tambahan",
  social_links: "Media sosial",
  footer: "Footer",
};

export const branchPageSchema = z.object({
  branchId: z.uuid(),
  headline: z
    .string()
    .trim()
    .max(160)
    .transform((value) => value || null),
  introduction: z
    .string()
    .trim()
    .max(1000)
    .transform((value) => value || null),
  sections: z
    .array(
      z.object({
        sectionKey: z.enum(branchSectionKeys),
      publicTitle: z
        .string()
        .trim()
        .max(160)
        .transform((value) => value || null),
        sortOrder: z
          .string()
          .regex(/^\d+$/)
          .transform(Number)
          .refine(
            (value) => Number.isSafeInteger(value) && value <= 2147483647,
          ),
        isActive: z.boolean(),
      }),
    )
    .length(branchSectionKeys.length),
});
