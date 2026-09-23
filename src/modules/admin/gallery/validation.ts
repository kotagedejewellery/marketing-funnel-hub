import * as z from "zod";

export const galleryItemSchema = z.object({
  id: z.union([z.uuid(), z.literal("")]).transform((value) => value || null),
  branchId: z.uuid(),
  title: z
    .string()
    .trim()
    .max(160, "Judul maksimal 160 karakter.")
    .transform((value) => value || null),
  description: z
    .string()
    .trim()
    .max(1000, "Keterangan maksimal 1.000 karakter.")
    .transform((value) => value || null),
  altText: z
    .string()
    .trim()
    .min(1, "Teks alternatif wajib diisi.")
    .max(300, "Teks alternatif maksimal 300 karakter."),
  sortOrder: z
    .string()
    .regex(/^\d+$/, "Urutan harus berupa angka nol atau lebih.")
    .transform(Number)
    .refine(
      (value) => Number.isSafeInteger(value) && value <= 2147483647,
      "Urutan terlalu besar.",
    ),
  isActive: z.boolean(),
});
