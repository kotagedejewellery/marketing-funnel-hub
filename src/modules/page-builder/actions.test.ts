import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  requireAdmin: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("drizzle-orm", () => ({
  and: vi.fn(),
  asc: vi.fn(),
  eq: vi.fn(),
  inArray: vi.fn(),
  isNull: vi.fn(),
  sql: (strings: TemplateStringsArray) => strings.join(""),
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/db/client", () => ({ getDatabase: mocks.getDatabase }));
vi.mock("@/modules/admin/access", () => ({ requireAdmin: mocks.requireAdmin }));

import { publishPageBuilder, savePageBuilderDraft } from "./actions";

const branchId = "3f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4";
const assignmentId = "4f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4";

function readRows(rows: unknown[]) {
  const query = {
    from: () => query,
    innerJoin: () => query,
    where: () => query,
    orderBy: () => Promise.resolve(rows),
    limit: () => Promise.resolve(rows),
    then: (resolve: (value: unknown[]) => unknown) => resolve(rows),
  };
  return query;
}

function databaseFor(productRows: unknown[]) {
  const rows = [
    [{ id: branchId, slug: "pusat" }],
    productRows,
    [{ sectionKey: "products" }],
  ];
  const transaction = {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
      })),
    })),
  };
  return {
    select: vi.fn(() => readRows(rows.shift() ?? [])),
    transaction: vi.fn(async (callback) => callback(transaction)),
  };
}

describe("page builder actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({ id: "admin-1" });
  });

  it("allows a repeated active CTA reference for the same branch", async () => {
    mocks.getDatabase.mockReturnValue(databaseFor([{ id: assignmentId }]));

    const result = await savePageBuilderDraft(branchId, [
      {
        id: "5f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
        type: "product_cta",
        assignmentId,
        width: "full",
        isVisible: true,
      },
      {
        id: "6f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
        type: "product_cta",
        assignmentId,
        width: "half",
        isVisible: true,
      },
    ]);

    expect(result).toMatchObject({ ok: true });
  });

  it("rejects a CTA assignment that is unavailable for the branch", async () => {
    mocks.getDatabase.mockReturnValue(databaseFor([]));

    const result = await savePageBuilderDraft(branchId, [
      {
        id: "5f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
        type: "product_cta",
        assignmentId,
        width: "full",
        isVisible: true,
      },
    ]);

    expect(result).toEqual({
      ok: false,
      message: "Referensi blok tidak tersedia untuk cabang ini.",
    });
  });

  it("requires a visible product CTA before publishing", async () => {
    mocks.getDatabase.mockReturnValue(
      databaseFor([{ sectionKey: "products" }]),
    );

    const result = await publishPageBuilder(branchId, [
      {
        id: "5f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
        type: "rich_text",
        text: "Halo",
        width: "full",
        isVisible: true,
      },
    ]);

    expect(result).toEqual({
      ok: false,
      message: "Terbitkan minimal satu CTA WhatsApp produk yang tampil.",
    });
  });
});
