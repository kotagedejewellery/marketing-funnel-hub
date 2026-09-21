import { connection } from "next/server";
import { cookies, headers } from "next/headers";

import { LinkBio } from "@/components/public/link-bio";
import { loadPublicContent } from "@/modules/public-content/data";
import { serverEnv } from "@/lib/env/server";
import {
  attributionCookieName,
  getTrackingContext,
  parseTrackingContextHeader,
  sessionCookieName,
  trackingContextHeaderName,
} from "@/modules/tracking/journey";
import {
  consentCookieName,
  parseConsentCookie,
} from "@/modules/tracking/consent";

export const runtime = "nodejs";

export default async function HomePage() {
  await connection();
  const content = await loadPublicContent();
  const cookieStore = await cookies();
  const initialConsent = parseConsentCookie(
    cookieStore.get(consentCookieName)?.value,
  );
  const trackingContext =
    serverEnv.NEXT_PUBLIC_APP_ENV === "local" ||
    serverEnv.TRACKING_ENABLED === "true"
      ? (getTrackingContext(
          cookieStore.get(sessionCookieName)?.value,
          cookieStore.get(attributionCookieName)?.value,
        ) ??
        parseTrackingContextHeader(
          (await headers()).get(trackingContextHeaderName),
        ))
      : null;

  return (
    <LinkBio
      content={content}
      initialConsent={initialConsent}
      trackingContext={trackingContext}
    />
  );
}
