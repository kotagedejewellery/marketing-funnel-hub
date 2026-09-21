import * as z from "zod";

export const productSchema = z.object({
  id: z.union([z.uuid(), z.literal("")]),
  name: z.string().trim().min(1, "Nama produk wajib diisi.").max(120),
  slug: z
    .string()
    .trim()
    .min(1, "Slug wajib diisi.")
    .max(120)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Gunakan huruf kecil, angka, dan tanda hubung.",
    ),
  description: z
    .string()
    .trim()
    .max(2000)
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
