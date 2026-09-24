import * as z from "zod";

import { isAllowedPublicUrl } from "@/modules/admin/url-validation";

export const settingsSchema = z.object({
  siteName: z.string().trim().min(1, "Nama situs wajib diisi.").max(120),
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
  privacyUrl: z
    .string()
    .trim()
    .max(2048)
    .transform((value) => value || null)
    .refine(
      (value) => !value || isAllowedPublicUrl(value),
      "Gunakan URL HTTPS yang valid.",
    ),
  defaultWhatsappMessage: z
    .string()
    .trim()
    .min(1, "Pesan WhatsApp wajib diisi.")
    .max(500)
    .refine(
      (value) =>
        !/[{}]/.test(
          value.replaceAll("{product}", "").replaceAll("{branch}", ""),
        ),
      "Hanya variabel {product} dan {branch} yang didukung.",
    ),
  defaultCtaLabel: z.string().trim().min(1, "Label CTA wajib diisi.").max(80),
});

export const sectionActionSchema = z.object({
  id: z.uuid(),
  operation: z.enum(["up", "down", "activate", "deactivate", "title"]),
  publicTitle: z
    .string()
    .trim()
    .max(160)
    .transform((value) => value || null)
    .optional(),
});
