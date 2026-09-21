import "server-only";

import { count, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import * as z from "zod";

import { getDatabase } from "@/lib/db/client";
import { campaigns } from "@/lib/db/schema";
import { requireAdmin } from "@/modules/admin/access";

const pageSize = 20;

export async function getCampaignList(requestedPage: number) {
  await requireAdmin();
  const db = getDatabase();
  const [totalRows] = await db.select({ value: count() }).from(campaigns);
  const pageCount = Math.max(1, Math.ceil((totalRows?.value ?? 0) / pageSize));
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? Math.min(requestedPage, pageCount)
      : 1;
  const [rows, activeWindows] = await Promise.all([
    db
      .select()
      .from(campaigns)
      .orderBy(desc(campaigns.createdAt), desc(campaigns.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({
        id: campaigns.id,
        activeFrom: campaigns.activeFrom,
        activeUntil: campaigns.activeUntil,
      })
      .from(campaigns)
      .where(eq(campaigns.isActive, true)),
  ]);

  const hasOverlap = activeWindows.some((first, index) =>
    activeWindows
      .slice(index + 1)
      .some(
        (second) =>
          (!first.activeUntil ||
            !second.activeFrom ||
            first.activeUntil >= second.activeFrom) &&
          (!second.activeUntil ||
            !first.activeFrom ||
            second.activeUntil >= first.activeFrom),
      ),
  );

  return { rows, page, pageCount, hasOverlap };
}

export async function getCampaign(id: string) {
  await requireAdmin();
  if (!z.uuid().safeParse(id).success) notFound();
  const [row] = await getDatabase()
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, id))
    .limit(1);
  if (!row) notFound();
  return row;
}
