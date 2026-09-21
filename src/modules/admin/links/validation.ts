import * as z from "zod";

import { isAllowedPublicUrl } from "@/modules/admin/url-validation";

export const linkSchema = z.object({
  id: z.union([z.uuid(), z.literal("")]),
  label: z.string().trim().min(1, "Label tautan wajib diisi.").max(120),
  url: z
    .string()
    .trim()
    .max(2048)
    .refine(isAllowedPublicUrl, "Gunakan URL HTTPS yang valid."),
  linkType: z.enum(["secondary", "social"]),
  platform: z
    .string()
    .trim()
    .max(80)
    .transform((value) => value || null),
  iconKey: z
    .string()
    .trim()
    .max(80)
    .transform((value) => value || null),
  isActive: z.boolean(),
  sortOrder: z
    .string()
    .regex(/^\d+$/, "Urutan harus angka nol atau lebih.")
    .transform(Number)
    .refine(
      (value) => Number.isSafeInteger(value) && value <= 2147483647,
      "Urutan terlalu besar.",
    ),
});
