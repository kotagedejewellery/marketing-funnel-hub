import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  requireAdmin: vi.fn(),
  requireTechnicalAdmin: vi.fn(),
  redirect: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("drizzle-orm", () => ({
  and: vi.fn(),
  eq: vi.fn(),
  isNull: vi.fn(),
  max: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/db/client", () => ({ getDatabase: mocks.getDatabase }));
vi.mock("@/modules/admin/access", () => ({
  requireAdmin: mocks.requireAdmin,
  requireTechnicalAdmin: mocks.requireTechnicalAdmin,
}));

import { saveLink } from "./actions";

const initialState = { message: "", errors: {} };
const linkId = "7ab57b50-f501-45d0-a73e-6822ca473e5e";

function formData(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

function linkForm(overrides: Record<string, string> = {}) {
  return formData({
    id: linkId,
    branchId: "",
    label: "Lihat katalog",
    url: "https://example.com/katalog",
    linkType: "secondary",
    buttonStyle: "primary",
    platform: "",
    iconKey: "",
    isActive: "on",
    sortOrder: "0",
    stayOnPage: "1",
    ...overrides,
  });
}

function databaseForLinkSave(metaEventName: string | null) {
  const savedValues: Array<Record<string, unknown>> = [];
  const query = {
    from: () => query,
    where: () => query,
    limit: vi
      .fn()
      .mockResolvedValue([
        { id: linkId, branchId: null, sortOrder: 0, metaEventName },
      ]),
  };
  const tx = {
    select: vi.fn(() => query),
    update: vi.fn(() => ({
      set: (values: Record<string, unknown>) => {
        savedValues.push(values);
        return { where: vi.fn().mockResolvedValue(undefined) };
      },
    })),
    insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue(undefined) })),
  };
  return {
    database: {
      transaction: vi.fn(async (callback) => callback(tx)),
    },
    savedValues,
  };
}

describe("saveLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({ id: "admin-1" });
    mocks.requireTechnicalAdmin.mockResolvedValue({ id: "admin-1" });
  });

  it("requires a technical admin before accepting a Meta event field", async () => {
    mocks.requireTechnicalAdmin.mockRejectedValue(new Error("forbidden"));

    await expect(
      saveLink(
        initialState,
        linkForm({ linkType: "cta", metaEventName: "CTA_Katalog" }),
      ),
    ).rejects.toThrow("forbidden");
    expect(mocks.getDatabase).not.toHaveBeenCalled();
  });

  it("preserves an existing Meta override when a link stops being a CTA", async () => {
    const { database, savedValues } = databaseForLinkSave("CTA_Katalog");
    mocks.getDatabase.mockReturnValue(database);

    const result = await saveLink(initialState, linkForm());

    expect(result.ok).toBe(true);
    expect(savedValues[0]).toMatchObject({
      linkType: "secondary",
      metaEventName: "CTA_Katalog",
    });
  });
});
