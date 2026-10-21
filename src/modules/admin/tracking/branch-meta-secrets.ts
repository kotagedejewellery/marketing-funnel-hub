import "server-only";

import { requireTechnicalAdmin } from "@/modules/admin/access";
import { loadServerMetaTrackingConfig } from "@/modules/tracking/branch-meta-config";

export async function getBranchMetaTrackingSecretsForTechnicalAdmin(
  branchId: string,
) {
  await requireTechnicalAdmin();
  const config = await loadServerMetaTrackingConfig(branchId);
  return {
    capiAccessToken: config.capiAccessToken,
    capiTestEventCode: config.capiTestEventCode ?? null,
  };
}
