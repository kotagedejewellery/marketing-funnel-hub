import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/client", () => ({ getDatabase: vi.fn() }));
vi.mock("@/modules/admin/access", () => ({ requireAdmin: vi.fn() }));
const crypto = vi.hoisted(() => ({
  decryptFormValues: vi.fn(),
  encryptFormValues: vi.fn(),
  hashFormContactForSearch: vi.fn(),
}));

vi.mock("./crypto", () => crypto);

import {
  backfillFormResponseIdentity,
  parseFormResponseFilters,
} from "./management";

describe("form response filters", () => {
  it("keeps valid filters and defaults the first page", () => {
    expect(
      parseFormResponseFilters({
        branchId: "0c6b5a8d-c36b-43d6-a183-876aaea89eb1",
        start: "2026-11-01",
        end: "2026-11-17",
      }),
    ).toEqual({
      branchId: "0c6b5a8d-c36b-43d6-a183-876aaea89eb1",
      formId: null,
      productBranchId: null,
      start: "2026-11-01",
      end: "2026-11-17",
      whatsappStatus: null,
      cursor: null,
      page: 1,
    });
  });

  it("resets malformed query input to the default view", () => {
    expect(
      parseFormResponseFilters({ branchId: "not-a-uuid", page: "-3" }),
    ).toEqual({
      branchId: null,
      formId: null,
      productBranchId: null,
      start: null,
      end: null,
      whatsappStatus: null,
      cursor: null,
      page: 1,
    });
  });

  it("rejects impossible and inverted date ranges", () => {
    expect(
      parseFormResponseFilters({ start: "2026-99-99", end: "2026-11-17" }),
    ).toMatchObject({ start: null, end: null });
    expect(
      parseFormResponseFilters({ start: "2026-11-18", end: "2026-11-17" }),
    ).toMatchObject({ start: null, end: null });
  });

  it("accepts the WhatsApp continuation status filter", () => {
    expect(
      parseFormResponseFilters({ whatsappStatus: "continued" }),
    ).toMatchObject({
      whatsappStatus: "continued",
    });
    expect(parseFormResponseFilters({ whatsappStatus: "other" })).toMatchObject(
      {
        whatsappStatus: null,
      },
    );
  });

  it("backfills only the missing encrypted identity summaries for one form", async () => {
    const { getDatabase } = await import("@/lib/db/client");
    const { requireAdmin } = await import("@/modules/admin/access");
    vi.mocked(requireAdmin).mockResolvedValue({ id: "admin-1" } as never);
    vi.mocked(crypto.decryptFormValues).mockReturnValue({
      nama: "Minko",
      whatsapp: "082180008199",
    });
    vi.mocked(crypto.encryptFormValues).mockReturnValue("identity-encrypted");
    vi.mocked(crypto.hashFormContactForSearch).mockReturnValue("contact-hash");
    const update = vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi
            .fn()
            .mockResolvedValue([
              { id: "8f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4" },
            ]),
        })),
      })),
    }));
    const insert = vi.fn(() => ({
      values: vi.fn().mockResolvedValue(undefined),
    }));
    const layoutQuery = {
      from: () => layoutQuery,
      where: () => layoutQuery,
      limit: vi.fn().mockResolvedValue([
        {
          publishedBlocks: [
            {
              id: "5f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
              type: "form",
              title: "Private Appointment Jakarta",
              description: "",
              submitLabel: "Kirim",
              privacyNotice: "Data disimpan KGJ.",
              assignmentId: "4f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
              responseIdentity: {
                nameField: "nama",
                contactField: "whatsapp",
              },
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
                {
                  id: "7f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
                  name: "whatsapp",
                  label: "Nomor WhatsApp",
                  type: "tel",
                  placeholder: "",
                  help: "",
                  required: true,
                  options: [],
                },
              ],
              width: "full",
              isVisible: true,
            },
          ],
        },
      ]),
    };
    const submissionQuery = {
      from: () => submissionQuery,
      where: () => submissionQuery,
      orderBy: () => submissionQuery,
      limit: vi.fn().mockResolvedValue([
        {
          id: "8f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
          formSchema: {
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
              {
                id: "7f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
                name: "whatsapp",
                label: "Nomor WhatsApp",
                type: "tel",
                placeholder: "",
                help: "",
                required: true,
                options: [],
              },
            ],
          },
          valuesEncrypted: "submission-encrypted",
        },
      ]),
    };
    vi.mocked(getDatabase).mockReturnValue({
      select: vi
        .fn()
        .mockReturnValueOnce(layoutQuery)
        .mockReturnValueOnce(submissionQuery),
      update,
      insert,
    } as never);

    await expect(
      backfillFormResponseIdentity({
        branchId: "3f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
        formId: "5f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
      }),
    ).resolves.toEqual({
      ok: true,
      updated: 1,
      skipped: 0,
      nextCursor: null,
    });
    expect(update).toHaveBeenCalledTimes(1);
    expect(insert).toHaveBeenCalledTimes(1);
  });
});
