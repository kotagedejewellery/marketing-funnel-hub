import * as z from "zod";

export const branchSectionKeys = [
  "brand_header",
  "campaign_banner",
  "products",
  "faq",
  "secondary_links",
  "social_links",
  "footer",
] as const;

export const branchSectionLabels: Record<
  (typeof branchSectionKeys)[number],
  string
> = {
  brand_header: "Profil",
  campaign_banner: "Konten unggulan",
  products: "Produk & WhatsApp",
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
