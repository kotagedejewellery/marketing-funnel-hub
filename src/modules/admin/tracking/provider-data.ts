import "server-only";

import { createSign } from "node:crypto";

import { serverEnv } from "@/lib/env/server";

import type { AnalyticsDateRange } from "./data";

type ProviderReport =
  | { status: "not_configured" }
  | { status: "error" }
  | { status: "ready"; metrics: { label: string; value: number }[] };

export type ProviderAnalytics = {
  meta: ProviderReport;
  ga4: ProviderReport;
};

function base64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function serviceAccountAssertion() {
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({
      iss: serverEnv.GA4_SERVICE_ACCOUNT_EMAIL,
      scope: "https://www.googleapis.com/auth/analytics.readonly",
      aud: "https://oauth2.googleapis.com/token",
      iat: issuedAt,
      exp: issuedAt + 300,
    }),
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${payload}`);
  signer.end();
  const signature = signer.sign(
    serverEnv.GA4_SERVICE_ACCOUNT_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    "base64url",
  );
  return `${header}.${payload}.${signature}`;
}

async function fetchJson(url: string, init: RequestInit) {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(3_000),
  });
  if (!response.ok) throw new Error(`Provider response ${response.status}`);
  return response.json() as Promise<unknown>;
}

async function metaReport(range: AnalyticsDateRange): Promise<ProviderReport> {
  const accountId = serverEnv.META_AD_ACCOUNT_ID;
  const accessToken = serverEnv.META_MARKETING_API_ACCESS_TOKEN;
  if (!accountId || !accessToken) return { status: "not_configured" };
  try {
    const normalizedAccountId = accountId.startsWith("act_")
      ? accountId
      : `act_${accountId}`;
    const params = new URLSearchParams({
      fields: "impressions,reach,clicks",
      level: "account",
      time_range: JSON.stringify({
        since: range.startDate,
        until: range.endDate,
      }),
    });
    const payload = (await fetchJson(
      `https://graph.facebook.com/v26.0/${normalizedAccountId}/insights?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    )) as { data?: Array<Record<string, string>> };
    const report = payload.data?.[0];
    return {
      status: "ready",
      metrics: [
        { label: "Impresi", value: Number(report?.impressions ?? 0) },
        { label: "Jangkauan", value: Number(report?.reach ?? 0) },
        { label: "Klik iklan", value: Number(report?.clicks ?? 0) },
      ],
    };
  } catch {
    return { status: "error" };
  }
}

async function ga4Report(range: AnalyticsDateRange): Promise<ProviderReport> {
  if (
    !serverEnv.GA4_PROPERTY_ID ||
    !serverEnv.GA4_SERVICE_ACCOUNT_EMAIL ||
    !serverEnv.GA4_SERVICE_ACCOUNT_PRIVATE_KEY
  ) {
    return { status: "not_configured" };
  }
  try {
    const tokenPayload = (await fetchJson("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: serviceAccountAssertion(),
      }),
    })) as { access_token?: string };
    if (!tokenPayload.access_token) throw new Error("Missing provider token");
    const report = (await fetchJson(
      `https://analyticsdata.googleapis.com/v1beta/properties/${serverEnv.GA4_PROPERTY_ID}:runReport`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenPayload.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
          metrics: [
            { name: "activeUsers" },
            { name: "sessions" },
            { name: "screenPageViews" },
            { name: "eventCount" },
          ],
          returnPropertyQuota: false,
        }),
      },
    )) as { rows?: Array<{ metricValues?: Array<{ value?: string }> }> };
    const values = report.rows?.[0]?.metricValues ?? [];
    return {
      status: "ready",
      metrics: [
        { label: "Pengguna aktif", value: Number(values[0]?.value ?? 0) },
        { label: "Sesi", value: Number(values[1]?.value ?? 0) },
        { label: "Tayangan", value: Number(values[2]?.value ?? 0) },
        { label: "Event", value: Number(values[3]?.value ?? 0) },
      ],
    };
  } catch {
    return { status: "error" };
  }
}

export async function getProviderAnalytics(range: AnalyticsDateRange) {
  const [meta, ga4] = await Promise.all([metaReport(range), ga4Report(range)]);
  return { meta, ga4 };
}
