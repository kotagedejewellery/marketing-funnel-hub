import * as z from "zod";

import { isAllowedPublicUrl } from "@/modules/admin/url-validation";

export const linkSchema = z.object({
  id: z.union([z.uuid(), z.literal("")]),
  branchId: z.union([z.uuid(), z.literal("")]).default(""),
  label: z.string().trim().min(1, "Label tautan wajib diisi.").max(120),
  url: z
    .string()
    .trim()
    .max(2048)
    .refine(isAllowedPublicUrl, "Gunakan URL HTTPS yang valid."),
  linkType: z.enum(["secondary", "social", "cta"]),
  buttonStyle: z.enum(["primary", "soft", "outline"]).default("primary"),
  platform: z
    .string()
    .trim()
    .max(80)
    .transform((value) => value || null),
  iconKey: z
    .enum(["", "arrow", "catalog", "calendar"])
    .transform((value) => value || null),
  layoutPlacement: z.enum(["start", "end"]).default("end"),
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
