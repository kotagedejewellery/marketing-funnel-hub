import "server-only";

import { asc, eq, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import * as z from "zod";

import { getDatabase } from "@/lib/db/client";
import {
  branches,
  events,
  formSubmissions,
  links,
  siteSettings,
} from "@/lib/db/schema";
import { serverEnv } from "@/lib/env/server";
import { requireAdmin } from "@/modules/admin/access";

import { branchDeletionBlockReason } from "./deletion";

export async function getAllBranches() {
  await requireAdmin();
  const publicOrigin = new URL(serverEnv.NEXT_PUBLIC_SITE_URL).origin;
  const rows = await getDatabase()
    .select({
      id: branches.id,
      name: branches.name,
      slug: branches.slug,
      whatsappNumber: branches.whatsappNumber,
      ctaLabel: branches.ctaLabel,
      isActive: branches.isActive,
      sortOrder: branches.sortOrder,
      isDefault: sql<boolean>`exists (
        select 1 from ${siteSettings}
        where ${siteSettings.defaultLinkBioBranchId} = "branches"."id"
      )`,
      hasEvents: sql<boolean>`exists (
        select 1 from ${events}
        left join ${links} on "events"."link_id" = "links"."id"
        where "events"."branch_id" = "branches"."id"
          or "links"."branch_id" = "branches"."id"
          or "events"."page_url" = (${publicOrigin} || '/' || "branches"."slug")
      )`,
      hasFormSubmissions: sql<boolean>`exists (
        select 1 from ${formSubmissions}
        where ${formSubmissions.branchId} = "branches"."id"
      )`,
    })
    .from(branches)
    .orderBy(asc(branches.sortOrder), asc(branches.name), asc(branches.id));
  return rows.map(
    ({ isDefault, hasEvents, hasFormSubmissions, ...branch }) => ({
      ...branch,
      canDeactivate: branch.isActive && !isDefault,
      deletionBlockReason: branchDeletionBlockReason({
        isDefault,
        hasEvents,
        hasFormSubmissions,
      }),
    }),
  );
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
