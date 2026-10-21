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

function databaseForSave(...results: unknown[][]) {
  const savedValues: Array<Record<string, unknown>> = [];
  const mutation = (values: Record<string, unknown>) => {
    savedValues.push(values);
    return { where: vi.fn().mockResolvedValue(undefined) };
  };
  const transaction = {
    update: vi.fn(() => ({ set: mutation })),
    insert: vi.fn(() => ({ values: mutation })),
  };
  return {
    database: {
      select: vi.fn(() => readRows(results.shift() ?? [])),
      transaction: vi.fn(async (callback) => callback(transaction)),
    },
    savedValues,
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
        pageLoadMetaEvent: "PageView",
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
        pageLoadMetaEvent: "PageView",
        confirmCustomConfigRemoval: "false",
      }),
    );

    expect(result.errors.capiAccessToken).toMatch(/minimal terdiri dari 16/);
    expect(database.transaction).not.toHaveBeenCalled();
  });

  it("rejects a page-load event outside the approved standard-event list", async () => {
    const result = await saveBranchMetaTrackingConfig(
      initialState,
      formData({
        branchId: branch.id,
        mode: "inherit",
        pixelId: "",
        datasetId: "",
        capiAccessToken: "",
        pageLoadMetaEvent: "Custom",
        confirmCustomConfigRemoval: "false",
      }),
    );

    expect(result.errors.pageLoadMetaEvent).toBeTruthy();
    expect(mocks.getDatabase).not.toHaveBeenCalled();
  });

  it("keeps a configured test event code when a later save leaves its secret field blank", async () => {
    const { database, savedValues } = databaseForSave(
      [branch],
      [
        {
          branchId: branch.id,
          mode: "custom",
          capiAccessTokenEncrypted: "encrypted-token",
          capiTestEventCodeEncrypted: "encrypted-test-code",
        },
      ],
    );
    mocks.getDatabase.mockReturnValue(database);

    const result = await saveBranchMetaTrackingConfig(
      initialState,
      formData({
        branchId: branch.id,
        mode: "custom",
        pixelId: "123456",
        datasetId: "123456",
        capiAccessToken: "",
        capiTestEventCode: "",
        pageLoadMetaEvent: "PageView",
        confirmCustomConfigRemoval: "false",
      }),
    );

    expect(result.ok).toBe(true);
    expect(savedValues[0]).toMatchObject({
      capiTestEventCodeEncrypted: "encrypted-test-code",
    });
  });

  it("removes a configured test event code only when explicitly requested", async () => {
    const { database, savedValues } = databaseForSave(
      [branch],
      [
        {
          branchId: branch.id,
          mode: "custom",
          capiAccessTokenEncrypted: "encrypted-token",
          capiTestEventCodeEncrypted: "encrypted-test-code",
        },
      ],
    );
    mocks.getDatabase.mockReturnValue(database);

    const result = await saveBranchMetaTrackingConfig(
      initialState,
      formData({
        branchId: branch.id,
        mode: "custom",
        pixelId: "123456",
        datasetId: "123456",
        capiAccessToken: "",
        capiTestEventCode: "",
        clearCapiTestEventCode: "true",
        pageLoadMetaEvent: "PageView",
        confirmCustomConfigRemoval: "false",
      }),
    );

    expect(result.ok).toBe(true);
    expect(savedValues[0]).toMatchObject({
      capiTestEventCodeEncrypted: null,
    });
  });

  it("encrypts a replacement test event code before storing it", async () => {
    const { database, savedValues } = databaseForSave([branch], []);
    mocks.getDatabase.mockReturnValue(database);
    mocks.encryptMetaCapiToken.mockReturnValue("encrypted-replacement-code");

    const result = await saveBranchMetaTrackingConfig(
      initialState,
      formData({
        branchId: branch.id,
        mode: "custom",
        pixelId: "123456",
        datasetId: "123456",
        capiAccessToken: "1234567890123456",
        capiTestEventCode: "TEST123",
        pageLoadMetaEvent: "PageView",
        confirmCustomConfigRemoval: "false",
      }),
    );

    expect(result.ok).toBe(true);
    expect(mocks.encryptMetaCapiToken).toHaveBeenCalledWith("TEST123");
    expect(savedValues[0]).toMatchObject({
      capiTestEventCodeEncrypted: "encrypted-replacement-code",
    });
  });
});
