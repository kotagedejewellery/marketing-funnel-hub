import "server-only";

import { asc, eq } from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";
import { serverEnv } from "@/lib/env/server";
import { branches, productBranches, siteSettings } from "@/lib/db/schema";
import { requireAdmin } from "@/modules/admin/access";
import {
  publicAssetUrl,
  resolveWhatsappCta,
} from "@/modules/public-content/links";

export async function getProductAssignments(
  productId: string,
  productName: string,
) {
  await requireAdmin();
  const db = getDatabase();
  const [branchRows, assignmentRows, settingsRows] = await Promise.all([
    db
      .select()
      .from(branches)
      .orderBy(asc(branches.sortOrder), asc(branches.name), asc(branches.id)),
    db
      .select()
      .from(productBranches)
      .where(eq(productBranches.productId, productId)),
    db
      .select({
        defaultWhatsappMessage: siteSettings.defaultWhatsappMessage,
        defaultCtaLabel: siteSettings.defaultCtaLabel,
      })
      .from(siteSettings)
      .limit(1),
  ]);
  const settings = settingsRows[0];
  if (!settings) throw new Error("Pengaturan situs belum tersedia.");
  const byBranchId = new Map(assignmentRows.map((row) => [row.branchId, row]));
  return branchRows.map((branch) => {
    const assignment = byBranchId.get(branch.id);
    const cta = resolveWhatsappCta({
      number: branch.whatsappNumber,
      product: assignment?.displayName || productName,
      branch: branch.name,
      assignmentLabel: assignment?.ctaLabel ?? null,
      branchLabel: branch.ctaLabel,
      defaultLabel: settings.defaultCtaLabel,
      assignmentMessage: assignment?.whatsappMessageTemplate ?? null,
      defaultMessage: settings.defaultWhatsappMessage,
    });
    return {
      id: branch.id,
      name: branch.name,
      assignmentId: assignment?.id ?? null,
      isBranchActive: branch.isActive,
      isActive: assignment?.isActive ?? false,
      sortOrder: assignment?.sortOrder ?? branch.sortOrder,
      ctaLabel: assignment?.ctaLabel ?? "",
      displayName: assignment?.displayName ?? "",
      description: assignment?.description ?? "",
      imageUrl: publicAssetUrl(
        serverEnv.NEXT_PUBLIC_SUPABASE_URL,
        serverEnv.SUPABASE_PUBLIC_ASSET_BUCKET,
        assignment?.imagePath ?? null,
      ),
      whatsappMessageTemplate: assignment?.whatsappMessageTemplate ?? "",
      resolvedLabel: cta.ctaLabel,
      resolvedMessage: cta.message,
      whatsappUrl: cta.whatsappUrl,
    };
  });
}
