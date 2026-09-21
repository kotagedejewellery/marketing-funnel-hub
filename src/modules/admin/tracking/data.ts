import "server-only";

import { count, desc } from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";
import { events } from "@/lib/db/schema";
import { requireAdmin } from "@/modules/admin/access";

const pageSize = 20;

export async function getTrackingValidationList(requestedPage: number) {
  await requireAdmin();
  const db = getDatabase();
  const [totalRows] = await db.select({ value: count() }).from(events);
  const pageCount = Math.max(1, Math.ceil((totalRows?.value ?? 0) / pageSize));
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? Math.min(requestedPage, pageCount)
      : 1;
  const rows = await db
    .select({
      id: events.id,
      eventId: events.eventId,
      eventName: events.eventName,
      eventTime: events.eventTime,
      productCategory: events.productCategory,
      branchName: events.branchName,
      source: events.source,
      campaign: events.campaign,
      utmSource: events.utmSource,
      utmCampaign: events.utmCampaign,
    })
    .from(events)
    .orderBy(desc(events.eventTime), desc(events.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  return { rows, page, pageCount };
}
