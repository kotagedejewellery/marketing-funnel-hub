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
        onConflictDoNothing: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([{ revision: 0 }]),
        })),
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

    expect(result).toMatchObject({ ok: true, revision: 0 });
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

  it("allows publishing a form-only page", async () => {
    mocks.getDatabase.mockReturnValue(databaseFor([{ id: assignmentId }]));

    const result = await publishPageBuilder(branchId, [
      {
        id: "5f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
        type: "form",
        title: "Konsultasi",
        description: "",
        submitLabel: "Kirim",
        privacyNotice: "Data disimpan KGJ.",
        assignmentId,
        fields: [
          {
            id: "6f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
            name: "nama",
            label: "Nama lengkap",
            type: "text",
            placeholder: "",
            help: "",
            required: true,
            options: [],
          },
        ],
        width: "full",
        isVisible: true,
      },
    ]);

    expect(result).toMatchObject({ ok: true, revision: 0 });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/pusat");
  });

  it("requires at least one block before publishing", async () => {
    mocks.getDatabase.mockReturnValue(databaseFor([]));

    await expect(publishPageBuilder(branchId, [])).resolves.toEqual({
      ok: false,
      message: "Tambahkan minimal satu blok sebelum menerbitkan.",
    });
  });

  it("saves an unfinished free block as a draft but rejects it at publication", async () => {
    mocks.getDatabase
      .mockReturnValueOnce(databaseFor([]))
      .mockReturnValueOnce(databaseFor([]))
      .mockReturnValueOnce(databaseFor([]))
      .mockReturnValueOnce(databaseFor([]));
    const blocks = [
      {
        id: "5f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
        type: "image" as const,
        url: "",
        alt: "",
        width: "full" as const,
        isVisible: true,
      },
    ];

    await expect(savePageBuilderDraft(branchId, blocks)).resolves.toMatchObject(
      {
        ok: true,
      },
    );
    await expect(publishPageBuilder(branchId, blocks)).resolves.toEqual({
      ok: false,
      message: "Masukkan URL gambar HTTPS sebelum menerbitkan.",
    });
  });
});
