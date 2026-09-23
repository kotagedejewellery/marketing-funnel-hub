import "server-only";

import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import * as z from "zod";

import { getDatabase } from "@/lib/db/client";
import { branches } from "@/lib/db/schema";
import { requireAdmin } from "@/modules/admin/access";

export async function getAllBranches() {
  await requireAdmin();
  return getDatabase()
    .select()
    .from(branches)
    .orderBy(asc(branches.sortOrder), asc(branches.name), asc(branches.id));
}

export async function getBranch(id: string) {
  await requireAdmin();
  if (!z.uuid().safeParse(id).success) notFound();
  const [row] = await getDatabase()
    .select()
    .from(branches)
    .where(eq(branches.id, id))
    .limit(1);
  if (!row) notFound();
  return row;
}
