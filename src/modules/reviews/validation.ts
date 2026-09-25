import * as z from "zod";

const googleMapsUrlMessage =
  "Gunakan URL HTTPS Google Maps resmi untuk cabang ini.";

export function isGoogleMapsUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return false;

    const hostname = url.hostname.toLowerCase();
    if (hostname === "maps.app.goo.gl") return true;
    if (hostname === "goo.gl") return url.pathname.startsWith("/maps");
    if (!/(^|\.)google\.[a-z.]+$/.test(hostname)) return false;
    return (
      hostname.startsWith("maps.") ||
      url.pathname.startsWith("/maps") ||
      (url.pathname === "/search" &&
        url.searchParams.has("q") &&
        url.hash.startsWith("#lrd="))
    );
  } catch {
    return false;
  }
}

export const reviewSourceSchema = z.object({
  branchId: z.uuid(),
  sourceUrl: z
    .string()
    .trim()
    .max(2048)
    .refine(isGoogleMapsUrl, googleMapsUrlMessage),
  isEnabled: z.boolean(),
  minimumRating: z
    .string()
    .regex(/^[1-5]$/, "Pilih rating minimum antara 1 sampai 5.")
    .transform(Number),
  maximumReviews: z
    .string()
    .regex(/^([1-9]|1[0-2])$/, "Pilih 1 sampai 12 review.")
    .transform(Number),
  displayMode: z.enum(["automatic", "manual"]),
});

const reviewDisplayChangeSchema = z.object({
  id: z.uuid(),
  isSelected: z.boolean(),
  isHidden: z.boolean(),
});

function parseReviewList(value: string, context: z.RefinementCtx) {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) throw new Error("Expected array");
    return parsed;
  } catch {
    context.addIssue({ code: "custom", message: "Daftar review tidak valid." });
    return z.NEVER;
  }
}

export const reviewDisplayBatchSchema = z.object({
  branchId: z.uuid(),
  reviews: z
    .string()
    .max(20_000)
    .transform(parseReviewList)
    .pipe(z.array(reviewDisplayChangeSchema).min(1).max(50)),
});

export const reviewDeleteSchema = z.object({
  branchId: z.uuid(),
  ids: z
    .string()
    .max(5_000)
    .transform(parseReviewList)
    .pipe(z.array(z.uuid()).min(1).max(50)),
});

export const branchReviewSchema = z.object({ branchId: z.uuid() });

const extractedReviewSchema = z.object({
  reviewerName: z.string().trim().min(1).max(160),
  reviewerPhotoUrl: z.string().url().max(2048).nullable().optional(),
  reviewerReviewCount: z
    .number()
    .int()
    .min(0)
    .max(1_000_000)
    .nullable()
    .optional(),
  rating: z.number().int().min(1).max(5),
  relativeTime: z.string().trim().min(1).max(120),
  relativeTimeId: z.string().trim().min(1).max(160),
  reviewText: z.string().trim().min(1).max(4_000),
  reviewTextId: z.string().trim().min(1).max(5_000),
});

export const extractedGoogleReviewsSchema = z.object({
  reviews: z.array(extractedReviewSchema).min(1).max(50),
});

export type ExtractedGoogleReview = z.infer<typeof extractedReviewSchema>;
