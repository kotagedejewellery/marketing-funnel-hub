import * as z from "zod";

export const branchSectionKeys = [
  "brand_header",
  "campaign_banner",
  "products",
  "secondary_links",
  "social_links",
  "footer",
] as const;

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
