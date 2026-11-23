import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const router = vi.hoisted(() => ({ refresh: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => router }));

import { FormResponseTable } from "./form-response-table";

describe("FormResponseTable", () => {
  beforeEach(() => {
    router.refresh.mockReset();
    HTMLDialogElement.prototype.showModal = function showModal() {
      this.setAttribute("open", "");
    };
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          title: "Konsultasi",
          decryptable: true,
          values: [{ label: "Nama lengkap", value: "Nadia" }],
        }),
      ),
    );
  });

  it("keeps answers out of the table until an admin requests detail", async () => {
    render(
      <FormResponseTable
        filters={{
          branchId: null,
          formId: null,
          productBranchId: null,
          start: null,
          end: null,
          whatsappStatus: null,
          page: 1,
        }}
        total={1}
        summary={{ submitted: 1, continued: 0 }}
        pageCount={1}
        rows={[
          {
            id: "0c6b5a8d-c36b-43d6-a183-876aaea89eb1",
            submittedAt: new Date("2026-11-17T00:00:00Z"),
            whatsappContinuedAt: null,
            formTitle: "Konsultasi",
            branchName: "KGJ Pusat",
            productName: "Cincin",
            identity: { name: "Nadia Putri", contact: "0812••••1234" },
            googleSheetsStatus: "failed",
          },
        ]}
        branches={[]}
        forms={[]}
        products={[]}
        filterError={false}
      />,
    );

    expect(screen.queryByText("Nadia")).not.toBeInTheDocument();
    expect(screen.getAllByText("Google Sheets gagal")).not.toHaveLength(0);
    fireEvent.click(
      screen.getAllByRole("button", { name: "Lihat respons" })[0],
    );

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/form-responses/0c6b5a8d-c36b-43d6-a183-876aaea89eb1",
      { cache: "no-store" },
    );
    expect(await screen.findByText("Nadia")).toBeVisible();
  });

  it("shows the configured respondent summary without exposing a full contact", () => {
    render(
      <FormResponseTable
        filters={{
          branchId: null,
          formId: null,
          productBranchId: null,
          start: null,
          end: null,
          whatsappStatus: null,
          page: 1,
        }}
        total={1}
        summary={{ submitted: 1, continued: 0 }}
        pageCount={1}
        rows={[
          {
            id: "0c6b5a8d-c36b-43d6-a183-876aaea89eb1",
            submittedAt: new Date("2026-11-17T00:00:00Z"),
            whatsappContinuedAt: null,
            formTitle: "Konsultasi",
            branchName: "KGJ Pusat",
            productName: "Cincin",
            identity: { name: "Nadia Putri", contact: "0812••••1234" },
            googleSheetsStatus: null,
          },
        ]}
        branches={[]}
        forms={[]}
        products={[]}
        filterError={false}
      />,
    );

    expect(screen.getAllByText("Nadia Putri")).not.toHaveLength(0);
    expect(screen.getAllByText("0812••••1234")).not.toHaveLength(0);
    expect(screen.queryByText("081234567890")).not.toBeInTheDocument();
  });

  it("offers an explicit identity backfill for a response without a summary", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          updated: 1,
          skipped: 0,
          nextCursor: "batch-dua",
        }),
        { status: 200 },
      ),
    );
    render(
      <FormResponseTable
        filters={{
          branchId: null,
          formId: null,
          productBranchId: null,
          start: null,
          end: null,
          whatsappStatus: null,
          page: 1,
        }}
        total={1}
        summary={{ submitted: 1, continued: 0 }}
        pageCount={1}
        rows={[
          {
            id: "0c6b5a8d-c36b-43d6-a183-876aaea89eb1",
            branchId: "3f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
            formBlockId: "5f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
            submittedAt: new Date("2026-11-17T00:00:00Z"),
            whatsappContinuedAt: null,
            formTitle: "Konsultasi",
            branchName: "KGJ Pusat",
            productName: "Cincin",
            googleSheetsStatus: null,
          },
        ]}
        branches={[]}
        forms={[]}
        products={[]}
        filterError={false}
      />,
    );

    fireEvent.click(
      screen.getAllByRole("button", { name: "Terapkan identitas" })[0],
    );

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/form-responses/identity-backfill",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            branchId: "3f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
            formId: "5f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
          }),
        }),
      ),
    );
    expect(
      await screen.findByText(
        "Identitas diperbarui untuk 1 respons. Jalankan lagi untuk batch berikutnya.",
      ),
    ).toBeVisible();
    expect(router.refresh).toHaveBeenCalled();

    fireEvent.click(
      screen.getAllByRole("button", { name: "Terapkan identitas" })[0],
    );
    await waitFor(() =>
      expect(global.fetch).toHaveBeenLastCalledWith(
        "/api/admin/form-responses/identity-backfill",
        expect.objectContaining({
          body: JSON.stringify({
            branchId: "3f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
            formId: "5f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
            cursor: "batch-dua",
          }),
        }),
      ),
    );
  });

  it("offers recovery for a pending Sheets delivery but not an uncertain one", () => {
    render(
      <FormResponseTable
        filters={{
          branchId: null,
          formId: null,
          productBranchId: null,
          start: null,
          end: null,
          whatsappStatus: null,
          page: 1,
        }}
        total={2}
        summary={{ submitted: 2, continued: 0 }}
        pageCount={1}
        rows={[
          {
            id: "0c6b5a8d-c36b-43d6-a183-876aaea89eb1",
            submittedAt: new Date("2026-11-17T00:00:00Z"),
            whatsappContinuedAt: null,
            formTitle: "Konsultasi",
            branchName: "KGJ Pusat",
            productName: "Cincin",
            googleSheetsStatus: "pending",
          },
          {
            id: "1c6b5a8d-c36b-43d6-a183-876aaea89eb1",
            submittedAt: new Date("2026-11-17T00:00:00Z"),
            whatsappContinuedAt: null,
            formTitle: "Konsultasi",
            branchName: "KGJ Pusat",
            productName: "Cincin",
            googleSheetsStatus: "unknown",
          },
        ]}
        branches={[]}
        forms={[]}
        products={[]}
        filterError={false}
      />,
    );

    expect(screen.getAllByText("Google Sheets menunggu")).not.toHaveLength(0);
    expect(
      screen.getAllByText("Periksa Google Sheets: status tidak pasti"),
    ).not.toHaveLength(0);
    expect(
      screen.getAllByRole("button", { name: /Kirim ulang (Google )?Sheets/i }),
    ).toHaveLength(2);
  });
});
