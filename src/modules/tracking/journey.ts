import "server-only";

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import * as z from "zod";

import { serverEnv } from "@/lib/env/server";
import type { TrackingContext } from "@/components/public/tracking-behavior";

export const sessionCookieName = "kgj_sid";
export const attributionCookieName = "kgj_attr";
export const trackingContextHeaderName = "x-kgj-tracking-context";
const maxAge = 30 * 60;
const keys = ["utmSource", "utmMedium", "utmCampaign", "utmContent", "utmTerm"] as const;
type Utms = Record<(typeof keys)[number], string | null>;

const utmsSchema = z.strictObject({
  utmSource: z.string().min(1).max(200).nullable(),
  utmMedium: z.string().min(1).max(200).nullable(),
  utmCampaign: z.string().min(1).max(200).nullable(),
  utmContent: z.string().min(1).max(200).nullable(),
  utmTerm: z.string().min(1).max(200).nullable(),
});

function signature(sessionId: string, payload: string) {
  return createHmac("sha256", serverEnv.SUPABASE_SECRET_KEY)
    .update(`kgj-attribution-v1:${sessionId}:${payload}`)
    .digest("base64url");
}

function readUtms(value: string | undefined, sessionId: string): Utms | null {
  if (!value || value.length > 2048) return null;
  const [version, payload, mac, extra] = value.split(".");
  if (version !== "v1" || !payload || !mac || extra) return null;
  const expected = Buffer.from(signature(sessionId, payload));
  const actual = Buffer.from(mac);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
    return null;
  try {
    return utmsSchema.parse(JSON.parse(Buffer.from(payload, "base64url").toString("utf8")));
  } catch {
    return null;
  }
}

function encodeUtms(utms: Utms, sessionId: string) {
  const payload = Buffer.from(JSON.stringify(utms)).toString("base64url");
  return `v1.${payload}.${signature(sessionId, payload)}`;
}

function explicitUtms(search: URLSearchParams): Utms | null {
  const utms = Object.fromEntries(
    keys.map((key) => {
      const queryKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      const value = search.get(queryKey)?.trim() || null;
      return [key, value && value.length <= 200 ? value : null];
    }),
  ) as Utms;
  return Object.values(utms).some(Boolean) ? utms : null;
}

export function getTrackingContext(
  sessionId: string | undefined,
  attributionCookie: string | undefined,
): TrackingContext | null {
  if (!z.uuid().safeParse(sessionId).success) return null;
  const utms = readUtms(attributionCookie, sessionId!);
  // A journey without UTM is still valid; invalid signed cookies are not.
  if (attributionCookie && !utms) return null;
  return {
    anonymousSessionId: sessionId!,
    attribution: {
      source: utms?.utmSource ?? null,
      campaign: utms?.utmCampaign ?? null,
      ...Object.fromEntries(keys.map((key) => [key, utms?.[key] ?? null])),
    } as TrackingContext["attribution"],
  };
}

export function parseTrackingContextHeader(value: string | null) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    const sessionId = z.uuid().safeParse(parsed.anonymousSessionId);
    const utms = utmsSchema.safeParse(parsed.attribution);
    if (!sessionId.success || !utms.success) return null;
    return {
      anonymousSessionId: sessionId.data,
      attribution: {
        source: utms.data.utmSource,
        campaign: utms.data.utmCampaign,
        ...utms.data,
      },
    } satisfies TrackingContext;
  } catch {
    return null;
  }
}

export function updatePublicJourney(request: NextRequest) {
  const incoming = request.cookies.get(sessionCookieName)?.value;
  let sessionId = z.uuid().safeParse(incoming).success ? incoming! : randomUUID();
  const signed = request.cookies.get(attributionCookieName)?.value;
  const previous = readUtms(signed, sessionId);
  const explicit = explicitUtms(request.nextUrl.searchParams);
  if (explicit && previous && keys.some((key) => explicit[key] !== previous[key])) {
    sessionId = randomUUID();
  }
  const utms = explicit ?? previous;
  const options = {
    httpOnly: true,
    secure: serverEnv.NEXT_PUBLIC_APP_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
  request.cookies.set(sessionCookieName, sessionId);
  if (utms) request.cookies.set(attributionCookieName, encodeUtms(utms, sessionId));
  else request.cookies.delete(attributionCookieName);

  const context = getTrackingContext(
    sessionId,
    utms ? encodeUtms(utms, sessionId) : undefined,
  );
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(
    trackingContextHeaderName,
    Buffer.from(
      JSON.stringify({
        anonymousSessionId: context?.anonymousSessionId,
        attribution: utms ?? Object.fromEntries(keys.map((key) => [key, null])),
      }),
    ).toString("base64url"),
  );
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.cookies.set(sessionCookieName, sessionId, options);
  if (utms) response.cookies.set(attributionCookieName, encodeUtms(utms, sessionId), options);
  else if (signed) response.cookies.delete(attributionCookieName);
  return response;
}
