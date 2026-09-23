import * as z from "zod";

const reservedSlugs = new Set([
  "admin",
  "api",
  "b",
  "favicon",
  "icon",
  "robots",
  "sitemap",
]);

export const branchSchema = z.object({
  id: z.union([z.uuid(), z.literal("")]),
  name: z.string().trim().min(1, "Nama cabang wajib diisi.").max(120),
  slug: z
    .string()
    .trim()
    .min(1, "Slug wajib diisi.")
    .max(120)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Gunakan huruf kecil, angka, dan tanda hubung.",
    )
    .refine(
      (value) => !reservedSlugs.has(value),
      "Slug ini dipakai oleh sistem. Pilih nama lain.",
    ),
  whatsappNumber: z
    .string()
    .trim()
    .regex(
      /^[1-9][0-9]{7,14}$/,
      "Gunakan 8–15 digit kode negara tanpa +, spasi, atau tanda hubung.",
    ),
  ctaLabel: z
    .string()
    .trim()
    .max(120)
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
