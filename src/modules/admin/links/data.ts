import "server-only";

import { asc, count, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import * as z from "zod";

import { getDatabase } from "@/lib/db/client";
import { links } from "@/lib/db/schema";
import { requireAdmin } from "@/modules/admin/access";

const pageSize = 20;

export async function getLinkList(requestedPage: number) {
  await requireAdmin();
  const db = getDatabase();
  const [totalRows] = await db.select({ value: count() }).from(links);
  const pageCount = Math.max(1, Math.ceil((totalRows?.value ?? 0) / pageSize));
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? Math.min(requestedPage, pageCount)
      : 1;
  const rows = await db
    .select()
    .from(links)
    .orderBy(asc(links.sortOrder), asc(links.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  return { rows, page, pageCount };
}

export async function getLink(id: string) {
  await requireAdmin();
  if (!z.uuid().safeParse(id).success) notFound();
  const [row] = await getDatabase()
    .select()
    .from(links)
    .where(eq(links.id, id))
    .limit(1);
  if (!row) notFound();
  return row;
}
