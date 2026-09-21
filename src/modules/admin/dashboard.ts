import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  isNull,
  lte,
  or,
  sql,
} from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";
import {
  auditLogs,
  branches,
  campaigns,
  products,
  siteSettings,
} from "@/lib/db/schema";

import { requireAdmin } from "./access";

export async function getAdminDashboard(now = new Date()) {
  await requireAdmin();
  const db = getDatabase();
  const [site, campaign, productCount, branchCount, recentChanges] =
    await Promise.all([
      db
        .select({ siteName: siteSettings.siteName })
        .from(siteSettings)
        .limit(1),
      db
        .select({ title: campaigns.title, name: campaigns.name })
        .from(campaigns)
        .where(
          and(
            eq(campaigns.isActive, true),
            or(isNull(campaigns.activeFrom), lte(campaigns.activeFrom, now)),
            or(isNull(campaigns.activeUntil), gte(campaigns.activeUntil, now)),
          ),
        )
        .orderBy(
          asc(campaigns.sortOrder),
          sql`${campaigns.activeFrom} desc nulls last`,
          desc(campaigns.createdAt),
          asc(campaigns.id),
        )
        .limit(1),
      db
        .select({ value: count() })
        .from(products)
        .where(eq(products.isActive, true)),
      db
        .select({ value: count() })
        .from(branches)
        .where(eq(branches.isActive, true)),
      db
        .select({
          id: auditLogs.id,
          action: auditLogs.action,
          entityType: auditLogs.entityType,
          createdAt: auditLogs.createdAt,
        })
        .from(auditLogs)
        .orderBy(desc(auditLogs.createdAt))
        .limit(5),
    ]);

  return {
    siteName: site[0]?.siteName ?? null,
    campaignName: campaign[0]?.title ?? campaign[0]?.name ?? null,
    activeProducts: productCount[0]?.value ?? 0,
    activeBranches: branchCount[0]?.value ?? 0,
    recentChanges,
  };
}
