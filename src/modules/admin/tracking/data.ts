import "server-only";

import { and, desc, eq, gte, lt, type SQL } from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";
import { branches, events } from "@/lib/db/schema";
import { serverEnv } from "@/lib/env/server";
import { requireAdmin } from "@/modules/admin/access";

import { getProviderAnalytics, type ProviderAnalytics } from "./provider-data";

import type { TrackingAnalyticsFilters } from "./validation";

const jakartaTimeZone = "Asia/Jakarta";
const pageSize = 20;
export const eventNames = ["PageView", "Contact", "LinkClick"] as const;
type EventName = (typeof eventNames)[number];
type EventRow = {
  id: string;
  eventId: string;
  eventName: string;
  eventTime: Date;
  anonymousSessionId: string;
  pageUrl: string | null;
  productCategory: string | null;
  branchId: string | null;
  branchName: string | null;
  linkLabel: string | null;
  linkType: string | null;
  source: string | null;
  campaign: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  deviceType: string | null;
  browserFamily: string | null;
  countryCode: string | null;
  city: string | null;
};

export type AnalyticsDateRange = {
  start: Date;
  endExclusive: Date;
  startDate: string;
  endDate: string;
  label: string;
};

type EventTotals = Record<EventName, number>;

export type TrackingAnalytics = {
  filters: TrackingAnalyticsFilters;
  range: AnalyticsDateRange;
  branches: { id: string; name: string; slug: string }[];
  selectedBranch: string | null;
  totals: EventTotals;
  previousTotals: EventTotals;
  whatsappConversion: number | null;
  trend: Array<{ day: string; label: string } & EventTotals>;
  branchPerformance: Array<
    { id: string; name: string; conversion: number | null } & EventTotals
  >;
  products: { name: string; Contact: number }[];
  sources: { name: string; count: number }[];
  campaigns: { name: string; count: number }[];
  devices: { name: string; count: number }[];
  browsers: { name: string; count: number }[];
  countries: { name: string; count: number }[];
  cities: { name: string; count: number }[];
  detailOptions: {
    products: string[];
    sources: string[];
    campaigns: string[];
  };
  detailEvents: EventRow[];
  detailPage: number;
  detailPageCount: number;
  providers: ProviderAnalytics;
};

function partsInJakarta(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: jakartaTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  return Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  ) as { year: string; month: string; day: string };
}

function dateKey(date: Date) {
  const parts = partsInJakarta(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function jakartaMidnight(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const result = new Date(Date.UTC(year, month - 1, day - 1, 17));
  return Number.isNaN(result.getTime()) || dateKey(result) !== date
    ? null
    : result;
}

function addDays(date: Date, amount: number) {
  return new Date(date.getTime() + amount * 24 * 60 * 60 * 1000);
}

function dateLabel(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    timeZone: jakartaTimeZone,
  }).format(date);
}

function rangeLabel(start: Date, endExclusive: Date) {
  const lastDay = addDays(endExclusive, -1);
  const formatter = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: jakartaTimeZone,
  });
  return `${formatter.format(start)} – ${formatter.format(lastDay)}`;
}

export function resolveAnalyticsDateRange(
  filters: Pick<TrackingAnalyticsFilters, "range" | "start" | "end">,
  now = new Date(),
): AnalyticsDateRange {
  const today = jakartaMidnight(dateKey(now));
  if (!today) throw new Error("Waktu dashboard tidak dapat dihitung.");
  let start: Date;
  let endExclusive: Date;
  if (filters.range === "custom") {
    const customStart = filters.start ? jakartaMidnight(filters.start) : null;
    const customEnd = filters.end ? jakartaMidnight(filters.end) : null;
    const maximumEnd = addDays(today, 1);
    if (
      customStart &&
      customEnd &&
      customStart <= customEnd &&
      customEnd < maximumEnd &&
      customEnd.getTime() - customStart.getTime() <= 365 * 24 * 60 * 60 * 1000
    ) {
      start = customStart;
      endExclusive = addDays(customEnd, 1);
    } else {
      start = addDays(today, -29);
      endExclusive = addDays(today, 1);
    }
  } else if (filters.range === "7") {
    start = addDays(today, -6);
    endExclusive = addDays(today, 1);
  } else if (filters.range === "month") {
    const parts = partsInJakarta(today);
    start = jakartaMidnight(`${parts.year}-${parts.month}-01`)!;
    endExclusive = addDays(today, 1);
  } else {
    start = addDays(today, -29);
    endExclusive = addDays(today, 1);
  }
  return {
    start,
    endExclusive,
    startDate: dateKey(start),
    endDate: dateKey(addDays(endExclusive, -1)),
    label: rangeLabel(start, endExclusive),
  };
}

function asEventName(value: string): EventName | null {
  return eventNames.includes(value as EventName) ? (value as EventName) : null;
}

function emptyTotals(): EventTotals {
  return { PageView: 0, Contact: 0, LinkClick: 0 };
}

function ratio(numerator: number, denominator: number) {
  return denominator ? numerator / denominator : null;
}

function attributionValue(row: EventRow, field: "source" | "campaign") {
  const value =
    field === "source"
      ? (row.source ?? row.utmSource)
      : (row.campaign ?? row.utmCampaign);
  return value || `Tanpa UTM ${field}`;
}

function countBy<T>(rows: EventRow[], value: (row: EventRow) => T | null) {
  const counts = new Map<T, number>();
  for (const row of rows) {
    const key = value(row);
    if (key === null) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort(
      (left, right) =>
        right.count - left.count ||
        String(left.name).localeCompare(String(right.name), "id"),
    );
}

function countDistinctSessions(
  rows: EventRow[],
  value: (row: EventRow) => string | null,
) {
  const sessionsByName = new Map<string, Set<string>>();
  for (const row of rows) {
    const name = value(row);
    if (!name) continue;
    const sessions = sessionsByName.get(name) ?? new Set<string>();
    sessions.add(row.anonymousSessionId);
    sessionsByName.set(name, sessions);
  }
  return [...sessionsByName.entries()]
    .map(([name, sessions]) => ({ name, count: sessions.size }))
    .sort(
      (left, right) =>
        right.count - left.count || left.name.localeCompare(right.name, "id"),
    );
}

function namesWithMinimumEvents(
  rows: EventRow[],
  value: (row: EventRow) => string | null,
  minimumEvents: number,
) {
  return new Set(
    countBy(rows, value)
      .filter((row) => row.count >= minimumEvents)
      .map((row) => row.name),
  );
}

const deviceLabels: Record<string, string> = {
  mobile: "Ponsel",
  tablet: "Tablet",
  desktop: "Desktop",
  other: "Lainnya",
};

function deviceLabel(device: string | null) {
  if (!device) return null;
  return deviceLabels[device] ?? device;
}

const countryNames = new Intl.DisplayNames(["id-ID"], { type: "region" });

function countryLabel(countryCode: string | null) {
  if (!countryCode) return null;
  return `${countryNames.of(countryCode) ?? countryCode} (${countryCode})`;
}

function branchPageUrl(slug: string) {
  return new URL(`/${slug}`, serverEnv.NEXT_PUBLIC_SITE_URL)
    .toString()
    .replace(/\/$/, "");
}

function detailFilter(rows: EventRow[], filters: TrackingAnalyticsFilters) {
  return rows.filter((row) => {
    if (!asEventName(row.eventName)) return false;
    if (filters.eventName && row.eventName !== filters.eventName) return false;
    if (filters.product && row.productCategory !== filters.product)
      return false;
    if (filters.source && attributionValue(row, "source") !== filters.source)
      return false;
    if (
      filters.campaign &&
      attributionValue(row, "campaign") !== filters.campaign
    )
      return false;
    return true;
  });
}

async function eventRows(
  range: AnalyticsDateRange,
  branch: { slug: string } | null,
) {
  const conditions: SQL[] = [
    gte(events.eventTime, range.start),
    lt(events.eventTime, range.endExclusive),
  ];
  if (branch) conditions.push(eq(events.pageUrl, branchPageUrl(branch.slug)));
  return getDatabase()
    .select({
      id: events.id,
      eventId: events.eventId,
      eventName: events.eventName,
      eventTime: events.eventTime,
      anonymousSessionId: events.anonymousSessionId,
      pageUrl: events.pageUrl,
      productCategory: events.productCategory,
      branchId: events.branchId,
      branchName: events.branchName,
      linkLabel: events.linkLabel,
      linkType: events.linkType,
      source: events.source,
      campaign: events.campaign,
      utmSource: events.utmSource,
      utmMedium: events.utmMedium,
      utmCampaign: events.utmCampaign,
      utmContent: events.utmContent,
      utmTerm: events.utmTerm,
      deviceType: events.deviceType,
      browserFamily: events.browserFamily,
      countryCode: events.countryCode,
      city: events.city,
    })
    .from(events)
    .where(and(...conditions))
    .orderBy(desc(events.eventTime), desc(events.id));
}

async function scopedInputs(filters: TrackingAnalyticsFilters) {
  const db = getDatabase();
  const [branchRows, range] = await Promise.all([
    db
      .select({ id: branches.id, name: branches.name, slug: branches.slug })
      .from(branches)
      .orderBy(branches.sortOrder, branches.name),
    Promise.resolve(resolveAnalyticsDateRange(filters)),
  ]);
  const selectedBranch = filters.branchId
    ? (branchRows.find((branch) => branch.id === filters.branchId) ?? null)
    : null;
  return { branchRows, range, selectedBranch };
}

export async function getTrackingExportRows(filters: TrackingAnalyticsFilters) {
  await requireAdmin();
  const { range, selectedBranch } = await scopedInputs(filters);
  return detailFilter(await eventRows(range, selectedBranch), filters).slice(
    0,
    10_000,
  );
}

export async function getTrackingAnalytics(
  filters: TrackingAnalyticsFilters,
): Promise<TrackingAnalytics> {
  await requireAdmin();
  const { branchRows, range, selectedBranch } = await scopedInputs(filters);
  const lengthInDays = Math.round(
    (range.endExclusive.getTime() - range.start.getTime()) / 86_400_000,
  );
  const previousRange: AnalyticsDateRange = {
    start: addDays(range.start, -lengthInDays),
    endExclusive: range.start,
    startDate: "",
    endDate: "",
    label: "",
  };
  const [rows, previousRows, providers] = await Promise.all([
    eventRows(range, selectedBranch),
    eventRows(previousRange, selectedBranch),
    getProviderAnalytics(range),
  ]);
  const totals = emptyTotals();
  const previousTotals = emptyTotals();
  for (const row of previousRows) {
    const eventName = asEventName(row.eventName);
    if (eventName) previousTotals[eventName] += 1;
  }
  const days = new Map<string, { day: string; label: string } & EventTotals>();
  for (let day = range.start; day < range.endExclusive; day = addDays(day, 1)) {
    const key = dateKey(day);
    days.set(key, { day: key, label: dateLabel(day), ...emptyTotals() });
  }
  const branchIdByPageUrl = new Map(
    branchRows.map((branch) => [branchPageUrl(branch.slug), branch.id]),
  );
  const branchById = new Map(branchRows.map((branch) => [branch.id, branch]));
  const branchStats = new Map<
    string,
    { id: string; name: string } & EventTotals
  >();
  for (const row of rows) {
    const eventName = asEventName(row.eventName);
    if (!eventName) continue;
    totals[eventName] += 1;
    const day = days.get(dateKey(row.eventTime));
    if (day) day[eventName] += 1;
    const branchId =
      row.branchId ??
      (row.pageUrl ? branchIdByPageUrl.get(row.pageUrl) : undefined);
    const branch = branchId ? branchById.get(branchId) : null;
    if (branchId && branch) {
      const item = branchStats.get(branchId) ?? {
        id: branchId,
        name: branch.name,
        ...emptyTotals(),
      };
      item[eventName] += 1;
      branchStats.set(branchId, item);
    }
  }
  const activeRows = rows.filter((row) => asEventName(row.eventName));
  const detailOptions = {
    products: [
      ...new Set(
        activeRows.flatMap((row) =>
          row.productCategory ? [row.productCategory] : [],
        ),
      ),
    ].sort((a, b) => a.localeCompare(b, "id")),
    sources: [
      ...new Set(activeRows.map((row) => attributionValue(row, "source"))),
    ].sort((a, b) => a.localeCompare(b, "id")),
    campaigns: [
      ...new Set(activeRows.map((row) => attributionValue(row, "campaign"))),
    ].sort((a, b) => a.localeCompare(b, "id")),
  };
  const matchingDetails = detailFilter(rows, filters);
  const detailPageCount = Math.max(
    1,
    Math.ceil(matchingDetails.length / pageSize),
  );
  const detailPage = Math.min(filters.page, detailPageCount);
  const pageViews = rows.filter((row) => row.eventName === "PageView");
  const citiesWithEnoughEvents = namesWithMinimumEvents(
    activeRows,
    (row) => row.city,
    5,
  );
  return {
    filters,
    range,
    branches: branchRows,
    selectedBranch: selectedBranch?.name ?? null,
    totals,
    previousTotals,
    whatsappConversion: ratio(totals.Contact, totals.PageView),
    trend: [...days.values()],
    branchPerformance: [...branchStats.values()]
      .map((item) => ({
        ...item,
        conversion: ratio(item.Contact, item.PageView),
      }))
      .sort(
        (left, right) =>
          right.Contact - left.Contact ||
          right.PageView - left.PageView ||
          left.name.localeCompare(right.name, "id"),
      ),
    products: countBy(
      rows.filter((row) => row.eventName === "Contact"),
      (row) => row.productCategory,
    ).map((item) => ({ name: item.name, Contact: item.count })),
    sources: countDistinctSessions(pageViews, (row) =>
      attributionValue(row, "source"),
    ),
    campaigns: countDistinctSessions(pageViews, (row) =>
      attributionValue(row, "campaign"),
    ),
    devices: countDistinctSessions(pageViews, (row) =>
      deviceLabel(row.deviceType),
    ),
    browsers: countDistinctSessions(pageViews, (row) => row.browserFamily),
    countries: countDistinctSessions(pageViews, (row) =>
      countryLabel(row.countryCode),
    ),
    cities: countDistinctSessions(pageViews, (row) => row.city).filter((row) =>
      citiesWithEnoughEvents.has(row.name),
    ),
    detailOptions,
    detailEvents: matchingDetails.slice(
      (detailPage - 1) * pageSize,
      detailPage * pageSize,
    ),
    detailPage,
    detailPageCount,
    providers,
  };
}
