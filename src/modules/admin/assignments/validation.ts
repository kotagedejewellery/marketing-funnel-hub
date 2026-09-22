import * as z from "zod";

export const assignmentSchema = z.object({
  productId: z.uuid(),
  branchId: z.uuid(),
  isActive: z.boolean(),
  sortOrder: z
    .string()
    .regex(/^\d+$/, "Urutan harus angka nol atau lebih.")
    .transform(Number)
    .refine(
      (value) => Number.isSafeInteger(value) && value <= 2147483647,
      "Urutan terlalu besar.",
    ),
  ctaLabel: z
    .string()
    .trim()
    .max(120)
    .transform((value) => value || null),
  displayName: z
    .string()
    .trim()
    .max(160)
    .transform((value) => value || null),
  description: z
    .string()
    .trim()
    .max(2000)
    .transform((value) => value || null),
  whatsappMessageTemplate: z
    .string()
    .trim()
    .max(500)
    .refine(
      (value) =>
        !/[{}]/.test(
          value.replaceAll("{product}", "").replaceAll("{branch}", ""),
        ),
      "Hanya variabel {product} dan {branch} yang didukung.",
    )
    .transform((value) => value || null),
});
