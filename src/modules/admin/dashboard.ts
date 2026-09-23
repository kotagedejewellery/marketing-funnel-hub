import "server-only";

import { count, desc, eq } from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";
import { auditLogs, branches, products, siteSettings } from "@/lib/db/schema";

import { requireAdmin } from "./access";

export async function getAdminDashboard() {
  await requireAdmin();
  const db = getDatabase();
  const [site, productCount, branchCount, recentChanges] = await Promise.all([
    db.select({ siteName: siteSettings.siteName }).from(siteSettings).limit(1),
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
    activeProducts: productCount[0]?.value ?? 0,
    activeBranches: branchCount[0]?.value ?? 0,
    recentChanges,
  };
}
