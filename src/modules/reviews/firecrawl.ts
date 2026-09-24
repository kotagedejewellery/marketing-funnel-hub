import "server-only";

import { createHash } from "node:crypto";

import * as z from "zod";

import { serverEnv } from "@/lib/env/server";

import {
  extractedGoogleReviewsSchema,
  type ExtractedGoogleReview,
} from "./validation";

const firecrawlResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      json: z.unknown().optional(),
    })
    .optional(),
  error: z.string().max(500).optional(),
});

export class FirecrawlReviewError extends Error {}

export function googleReviewerPhotoUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    if (
      url.protocol !== "https:" ||
      (!hostname.endsWith(".googleusercontent.com") &&
        !hostname.endsWith(".gstatic.com"))
    ) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function reviewSourceHash(review: ExtractedGoogleReview) {
  return createHash("sha256")
    .update(
      [
        review.reviewerName.trim().toLocaleLowerCase("id-ID"),
        String(review.rating),
        review.relativeTime.trim().toLocaleLowerCase("id-ID"),
        review.reviewText.trim(),
      ].join("\n"),
    )
    .digest("hex");
}

function parsedExtractionPayload(value: unknown) {
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      throw new FirecrawlReviewError("Firecrawl mengembalikan data review tidak valid.");
    }
  }
  return value;
}

export async function scrapeGoogleMapsReviews(sourceUrl: string) {
  if (!serverEnv.FIRECRAWL_API_KEY) {
    throw new FirecrawlReviewError(
      "FIRECRAWL_API_KEY belum diatur pada environment server.",
    );
  }

  let response: Response;
  try {
    response = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(60_000),
      headers: {
        Authorization: `Bearer ${serverEnv.FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: sourceUrl,
        maxAge: 0,
        formats: [
          {
            type: "json",
            prompt:
              "Extract the visible Google Maps reviews for this place. Preserve the original review text exactly. Return only genuine review cards, do not invent values. reviewerReviewCount is the review count shown beside the reviewer when available.",
            schema: z.toJSONSchema(extractedGoogleReviewsSchema),
          },
        ],
      }),
    });
  } catch {
    throw new FirecrawlReviewError(
      "Firecrawl tidak dapat dihubungi. Coba lagi beberapa saat lagi.",
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new FirecrawlReviewError("Firecrawl mengembalikan respons tidak valid.");
  }

  const parsed = firecrawlResponseSchema.safeParse(body);
  if (!response.ok || !parsed.success || !parsed.data.success) {
    throw new FirecrawlReviewError(
      "Firecrawl belum dapat mengambil review dari URL ini.",
    );
  }
  const extracted = extractedGoogleReviewsSchema.safeParse(
    parsedExtractionPayload(parsed.data.data?.json),
  );
  if (!extracted.success) {
    throw new FirecrawlReviewError(
      "Review tidak ditemukan atau format Google Maps telah berubah.",
    );
  }

  return extracted.data.reviews;
}

