import * as z from "zod";

import { isAllowedPublicUrl } from "@/modules/admin/url-validation";

const wibDateInput = z
  .string()
  .refine(
    (value) => value === "" || parseWibDate(value) !== null,
    "Masukkan tanggal dan waktu WIB yang valid.",
  );

export const campaignSchema = z
  .object({
    id: z.union([z.uuid(), z.literal("")]),
    branchId: z.union([z.uuid(), z.literal("")]).default(""),
    name: z.string().trim().min(1, "Nama kampanye wajib diisi.").max(120),
    title: z
      .string()
      .trim()
      .max(160)
      .transform((value) => value || null),
    description: z
      .string()
      .trim()
      .max(1000)
      .transform((value) => value || null),
    targetUrl: z
      .string()
      .trim()
      .max(2048)
      .transform((value) => value || null)
      .refine(
        (value) => !value || isAllowedPublicUrl(value),
        "Gunakan URL HTTPS yang valid.",
      ),
    activeFrom: wibDateInput,
    activeUntil: wibDateInput,
    isActive: z.boolean(),
    sortOrder: z
      .string()
      .regex(/^\d+$/, "Urutan harus angka nol atau lebih.")
      .transform(Number)
      .refine(
        (value) => Number.isSafeInteger(value) && value <= 2147483647,
        "Urutan terlalu besar.",
      ),
  })
  .superRefine((input, context) => {
    const from = input.activeFrom ? parseWibDate(input.activeFrom) : null;
    const until = input.activeUntil ? parseWibDate(input.activeUntil) : null;
    if (from && until && until <= from) {
      context.addIssue({
        code: "custom",
        path: ["activeUntil"],
        message: "Waktu akhir harus setelah waktu mulai.",
      });
    }
  });

export function parseWibDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}:00+07:00`);
  if (Number.isNaN(date.getTime())) return null;
  const roundTrip = new Date(date.getTime() + 7 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);
  return roundTrip === value ? date : null;
}

export function toWibInput(date: Date | null): string {
  if (!date) return "";
  return new Date(date.getTime() + 7 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);
}
