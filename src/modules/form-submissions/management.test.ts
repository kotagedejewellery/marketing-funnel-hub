import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/client", () => ({ getDatabase: vi.fn() }));
vi.mock("@/modules/admin/access", () => ({ requireAdmin: vi.fn() }));
vi.mock("./crypto", () => ({ decryptFormValues: vi.fn() }));

import { parseFormResponseFilters } from "./management";

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
});
