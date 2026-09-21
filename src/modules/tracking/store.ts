import "server-only";

import { and, eq } from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";
import { branches, events, productBranches, products } from "@/lib/db/schema";
import type { CanonicalEvent } from "@/modules/tracking/event";

type StoredEvent = typeof events.$inferSelect;

function equivalent(existing: StoredEvent, event: CanonicalEvent) {
  const attribution = event.attribution;
  return (
    existing.eventName === event.eventName &&
    existing.anonymousSessionId === event.anonymousSessionId &&
    existing.eventTime.getTime() === Date.parse(event.eventTime) &&
    existing.pageUrl === event.pageUrl &&
    existing.productId === (event.product?.id ?? null) &&
    existing.branchId === (event.branch?.id ?? null) &&
    existing.cta === event.cta &&
    existing.source === attribution.source &&
    existing.campaign === attribution.campaign &&
    existing.utmSource === attribution.utmSource &&
    existing.utmMedium === attribution.utmMedium &&
    existing.utmCampaign === attribution.utmCampaign &&
    existing.utmContent === attribution.utmContent &&
    existing.utmTerm === attribution.utmTerm &&
    JSON.stringify(existing.metadata) === JSON.stringify(event.metadata)
  );
}

export async function existingEventStatus(event: CanonicalEvent) {
  const [existing] = await getDatabase()
    .select()
    .from(events)
    .where(eq(events.eventId, event.eventId))
    .limit(1);
  return existing
    ? equivalent(existing, event)
      ? "duplicate"
      : "conflict"
    : null;
}

export async function resolveEventContext(event: CanonicalEvent) {
  if (!event.product) return { product: null, branch: null };
  const db = getDatabase();
  const [product] = await db
    .select({ id: products.id, slug: products.slug })
    .from(products)
    .where(and(eq(products.id, event.product.id), eq(products.isActive, true)))
    .limit(1);
  if (!product) return null;
  if (!event.branch) return { product, branch: null };
  const [assignment] = await db
    .select({ id: branches.id, name: branches.name })
    .from(productBranches)
    .innerJoin(branches, eq(productBranches.branchId, branches.id))
    .where(
      and(
        eq(productBranches.productId, product.id),
        eq(productBranches.branchId, event.branch.id),
        eq(productBranches.isActive, true),
        eq(branches.isActive, true),
      ),
    )
    .limit(1);
  return assignment ? { product, branch: assignment } : null;
}

export async function storeEvent(
  event: CanonicalEvent,
  resolved: NonNullable<Awaited<ReturnType<typeof resolveEventContext>>>,
) {
  const db = getDatabase();
  const row = {
    eventId: event.eventId,
    anonymousSessionId: event.anonymousSessionId,
    eventName: event.eventName,
    eventTime: new Date(event.eventTime),
    pageUrl: event.pageUrl,
    productId: resolved.product?.id ?? null,
    productCategory: resolved.product?.slug ?? null,
    branchId: resolved.branch?.id ?? null,
    branchName: resolved.branch?.name ?? null,
    cta: event.cta,
    source: event.attribution.source,
    campaign: event.attribution.campaign,
    utmSource: event.attribution.utmSource,
    utmMedium: event.attribution.utmMedium,
    utmCampaign: event.attribution.utmCampaign,
    utmContent: event.attribution.utmContent,
    utmTerm: event.attribution.utmTerm,
    metadata: event.metadata,
  };
  const inserted = await db
    .insert(events)
    .values(row)
    .onConflictDoNothing({ target: events.eventId })
    .returning({ id: events.id });
  if (inserted.length) return "created" as const;

  return (await existingEventStatus(event)) ?? "conflict";
}
