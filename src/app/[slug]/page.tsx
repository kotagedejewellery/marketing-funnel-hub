import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { LinkBio } from "@/components/public/link-bio";
import { serverEnv } from "@/lib/env/server";
import { loadBranchPublicContent } from "@/modules/public-content/data";
import {
  consentCookieName,
  parseConsentCookie,
} from "@/modules/tracking/consent";
import {
  attributionCookieName,
  getTrackingContext,
  parseTrackingContextHeader,
  sessionCookieName,
  trackingContextHeaderName,
} from "@/modules/tracking/journey";

export const runtime = "nodejs";

export default async function BranchPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await connection();
  const { slug } = await params;
  if (slug.length > 120 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    notFound();
  }

  const content = await loadBranchPublicContent(slug);
  if (!content) notFound();

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
