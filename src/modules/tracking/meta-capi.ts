import "server-only";

import { isIP } from "node:net";

import { serverEnv } from "@/lib/env/server";
import type { CanonicalEvent } from "@/modules/tracking/event";
import type { resolveEventContext } from "@/modules/tracking/store";

type ResolvedContext = NonNullable<
  Awaited<ReturnType<typeof resolveEventContext>>
>;

export function metaPayload(
  event: CanonicalEvent,
  resolved: ResolvedContext,
  request: Request,
  cookieValues: { fbp?: string; fbc?: string },
) {
  const forwardedIp = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  const userAgent = request.headers.get("user-agent");
  const userData = {
    ...(forwardedIp &&
      isIP(forwardedIp) > 0 && { client_ip_address: forwardedIp }),
    ...(userAgent &&
      userAgent.length <= 512 && { client_user_agent: userAgent }),
    ...(cookieValues.fbp &&
      cookieValues.fbp.length <= 200 && { fbp: cookieValues.fbp }),
    ...(cookieValues.fbc &&
      cookieValues.fbc.length <= 200 && { fbc: cookieValues.fbc }),
  };
  if (Object.keys(userData).length === 0) return null;

  return {
    data: [
      {
        event_name: event.eventName,
        event_id: event.eventId,
        event_time: Math.floor(Date.parse(event.eventTime) / 1000),
        action_source: "website",
        event_source_url:
          event.pageUrl ??
          new URL("/", serverEnv.NEXT_PUBLIC_SITE_URL).toString(),
        user_data: userData,
        custom_data: {
          ...(resolved.product && { content_category: resolved.product.slug }),
          ...(resolved.branch && { branch: resolved.branch.name }),
          ...(event.cta && { cta: event.cta }),
          ...(event.attribution.utmSource && {
            utm_source: event.attribution.utmSource,
          }),
          ...(event.attribution.utmCampaign && {
            utm_campaign: event.attribution.utmCampaign,
          }),
        },
      },
    ],
  };
}

export async function sendMetaCapi(
  event: CanonicalEvent,
  resolved: ResolvedContext,
  request: Request,
  cookieValues: { fbp?: string; fbc?: string },
) {
  const datasetId = serverEnv.META_CAPI_DATASET_ID;
  const accessToken = serverEnv.META_CAPI_ACCESS_TOKEN;

  if (!datasetId || !accessToken) return;

  const payload = metaPayload(event, resolved, request, cookieValues);
  if (!payload) return;
  const endpoint = `https://graph.facebook.com/v26.0/${datasetId}/events`;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(1500),
        cache: "no-store",
      });
      if (response.ok) return;
      if (response.status < 500 && response.status !== 429) break;
    } catch {
      // One bounded retry uses the same event ID. Provider failure is best-effort.
    }
  }
  console.error("Meta CAPI delivery failed", {
    eventId: event.eventId,
    provider: "meta_capi",
    category: "delivery",
  });
}
