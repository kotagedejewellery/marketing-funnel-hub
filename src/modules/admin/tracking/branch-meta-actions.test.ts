import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  requireTechnicalAdmin: vi.fn(),
  encryptMetaCapiToken: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("drizzle-orm", () => ({ eq: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/db/client", () => ({ getDatabase: mocks.getDatabase }));
vi.mock("@/modules/admin/access", () => ({
  requireTechnicalAdmin: mocks.requireTechnicalAdmin,
}));
vi.mock("@/modules/tracking/branch-meta-config", () => ({
  encryptMetaCapiToken: mocks.encryptMetaCapiToken,
}));

import { saveBranchMetaTrackingConfig } from "./branch-meta-actions";

const branch = {
  id: "0de72a0d-c18d-4d2d-92ee-41607fd2939f",
  slug: "yogyakarta",
};

function readRows(rows: unknown[]) {
  const query = {
    from: () => query,
    where: () => query,
    limit: vi.fn().mockResolvedValue(rows),
  };
  return query;
}

function databaseFor(...results: unknown[][]) {
  return {
    select: vi.fn(() => readRows(results.shift() ?? [])),
    transaction: vi.fn(),
  };
}

function formData(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

const initialState = { message: "", errors: {} };

describe("saveBranchMetaTrackingConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireTechnicalAdmin.mockResolvedValue({ id: "admin-1" });
  });

  it("enforces the technical-admin boundary before reading configuration", async () => {
    mocks.requireTechnicalAdmin.mockRejectedValue(new Error("forbidden"));

    await expect(
      saveBranchMetaTrackingConfig(initialState, formData({})),
    ).rejects.toThrow("forbidden");
    expect(mocks.getDatabase).not.toHaveBeenCalled();
  });

  it("refuses to erase a custom configuration without an explicit confirmation", async () => {
    const database = databaseFor(
      [branch],
      [{ branchId: branch.id, mode: "custom", capiAccessTokenEncrypted: "v1" }],
    );
    mocks.getDatabase.mockReturnValue(database);

    const result = await saveBranchMetaTrackingConfig(
      initialState,
      formData({
        branchId: branch.id,
        mode: "inherit",
        pixelId: "",
        datasetId: "",
        capiAccessToken: "",
        pageViewEnabled: "on",
        confirmCustomConfigRemoval: "false",
      }),
    );

    expect(result.errors.mode).toMatch(/Konfirmasikan/);
    expect(database.transaction).not.toHaveBeenCalled();
  });

  it("rejects a new custom token that is shorter than the environment contract", async () => {
    const database = databaseFor([branch], []);
    mocks.getDatabase.mockReturnValue(database);

    const result = await saveBranchMetaTrackingConfig(
      initialState,
      formData({
        branchId: branch.id,
        mode: "custom",
        pixelId: "123456",
        datasetId: "123456",
        capiAccessToken: "short",
        pageViewEnabled: "on",
        confirmCustomConfigRemoval: "false",
      }),
    );

    expect(result.errors.capiAccessToken).toMatch(/minimal terdiri dari 16/);
    expect(database.transaction).not.toHaveBeenCalled();
  });
});
