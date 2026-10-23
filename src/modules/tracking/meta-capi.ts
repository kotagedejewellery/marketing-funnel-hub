import "server-only";

import { isIP } from "node:net";
import * as z from "zod";

import { serverEnv } from "@/lib/env/server";
import type { ServerMetaTrackingConfig } from "@/modules/tracking/branch-meta-config";
import type { CanonicalEvent } from "@/modules/tracking/event";
import { resolveMetaProviderEvent } from "@/modules/tracking/meta-event";
import type { resolveEventContext } from "@/modules/tracking/store";

type ResolvedContext = NonNullable<
  Awaited<ReturnType<typeof resolveEventContext>>
>;
type MetaCookieValues = { fbp?: string; fbc?: string; externalId?: string };

export function metaPayload(
  event: CanonicalEvent,
  resolved: ResolvedContext,
  request: Request,
  cookieValues: MetaCookieValues,
  metaEventName: string,
  testEventCode?: string | null,
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
    ...(z.uuid().safeParse(cookieValues.externalId).success && {
      external_id: cookieValues.externalId,
    }),
  };
  if (Object.keys(userData).length === 0) return null;

  return {
    ...(testEventCode && { test_event_code: testEventCode }),
    data: [
      {
        event_name: metaEventName,
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
          ...(event.eventName === "LinkClick" && {
            link_label: event.link.label,
            link_type: event.link.type,
          }),
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
  cookieValues: MetaCookieValues,
  config?: ServerMetaTrackingConfig,
) {
  const dataSourceId = config
    ? config.pixelId
    : serverEnv.NEXT_PUBLIC_META_PIXEL_ID;
  const accessToken = config
    ? config.capiAccessToken
    : serverEnv.META_CAPI_ACCESS_TOKEN;

  if (!dataSourceId || !accessToken) return;

  const metaEvent = resolveMetaProviderEvent(
    event,
    config?.whatsappCtaMetaEvent ?? null,
  );

  const payload = metaPayload(
    event,
    resolved,
    request,
    cookieValues,
    metaEvent.name,
    config?.capiTestEventCode,
  );
  if (!payload) return;
  const endpoint = `https://graph.facebook.com/v26.0/${dataSourceId}/events`;

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
