import "server-only";

import { cookies, headers } from "next/headers";
import { connection } from "next/server";

import { LinkBio } from "@/components/public/link-bio";
import { serverEnv } from "@/lib/env/server";
import {
  attributionCookieName,
  getTrackingContext,
  parseTrackingContextHeader,
  sessionCookieName,
  trackingContextHeaderName,
} from "@/modules/tracking/journey";

import { loadBranchPublicContent } from "./data";

export async function renderBranchLinkBio(slug: string) {
  await connection();
  const content = await loadBranchPublicContent(slug);
  if (!content) return null;

  const cookieStore = await cookies();
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

  return <LinkBio content={content} trackingContext={trackingContext} />;
}
