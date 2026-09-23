import "server-only";

import { and, count, desc, eq } from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";
import {
  auditLogs,
  branches,
  productBranches,
  products,
  siteSettings,
} from "@/lib/db/schema";

import { requireAdmin } from "./access";

export async function getAdminDashboard() {
  await requireAdmin();
  const db = getDatabase();
  const [site, buttonCount, branchCount, recentChanges] = await Promise.all([
    db.select({ siteName: siteSettings.siteName }).from(siteSettings).limit(1),
    db
      .select({ value: count() })
      .from(productBranches)
      .innerJoin(products, eq(productBranches.productId, products.id))
      .innerJoin(branches, eq(productBranches.branchId, branches.id))
      .where(
        and(
          eq(productBranches.isActive, true),
          eq(products.isActive, true),
          eq(branches.isActive, true),
        ),
      ),
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
    activeWhatsappButtons: buttonCount[0]?.value ?? 0,
    activeBranches: branchCount[0]?.value ?? 0,
    recentChanges,
  };
}
