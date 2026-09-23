import * as z from "zod";

export const faqSchema = z.object({
  id: z.union([z.uuid(), z.literal("")]).transform((value) => value || null),
  branchId: z
    .union([z.uuid(), z.literal("")])
    .transform((value) => value || null),
  question: z.string().trim().min(1, "Pertanyaan wajib diisi.").max(200),
  answer: z.string().trim().min(1, "Jawaban wajib diisi.").max(4000),
  sortOrder: z
    .string()
    .regex(/^\d+$/, "Urutan harus berupa angka positif.")
    .transform(Number)
    .refine((value) => Number.isSafeInteger(value) && value <= 2147483647),
  isActive: z.boolean(),
});

export const branchFaqSchema = z.object({ branchId: z.uuid() });
