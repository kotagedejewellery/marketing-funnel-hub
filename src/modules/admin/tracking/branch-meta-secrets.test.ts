import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireTechnicalAdmin: vi.fn(),
  loadServerMetaTrackingConfig: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/modules/admin/access", () => ({
  requireTechnicalAdmin: mocks.requireTechnicalAdmin,
}));
vi.mock("@/modules/tracking/branch-meta-config", () => ({
  loadServerMetaTrackingConfig: mocks.loadServerMetaTrackingConfig,
}));

import { getBranchMetaTrackingSecretsForTechnicalAdmin } from "./branch-meta-secrets";

describe("getBranchMetaTrackingSecretsForTechnicalAdmin", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns stored CAPI values only after the technical-admin check", async () => {
    mocks.requireTechnicalAdmin.mockResolvedValue({ id: "admin-1" });
    mocks.loadServerMetaTrackingConfig.mockResolvedValue({
      capiAccessToken: "capi-token",
      capiTestEventCode: "TEST123",
    });

    await expect(
      getBranchMetaTrackingSecretsForTechnicalAdmin("branch-1"),
    ).resolves.toEqual({
      capiAccessToken: "capi-token",
      capiTestEventCode: "TEST123",
    });
    expect(mocks.requireTechnicalAdmin).toHaveBeenCalledOnce();
    expect(mocks.loadServerMetaTrackingConfig).toHaveBeenCalledWith("branch-1");
  });

  it("does not load stored values when the technical-admin check rejects", async () => {
    mocks.requireTechnicalAdmin.mockRejectedValue(new Error("forbidden"));

    await expect(
      getBranchMetaTrackingSecretsForTechnicalAdmin("branch-1"),
    ).rejects.toThrow("forbidden");
    expect(mocks.loadServerMetaTrackingConfig).not.toHaveBeenCalled();
  });
});
