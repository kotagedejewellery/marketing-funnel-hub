import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FormResponseTable } from "./form-response-table";

describe("FormResponseTable", () => {
  beforeEach(() => {
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
          page: 1,
        }}
        total={1}
        pageCount={1}
        rows={[
          {
            id: "0c6b5a8d-c36b-43d6-a183-876aaea89eb1",
            submittedAt: new Date("2026-11-17T00:00:00Z"),
            formTitle: "Konsultasi",
            branchName: "KGJ Pusat",
            productName: "Cincin",
          },
        ]}
        branches={[]}
        forms={[]}
        products={[]}
        filterError={false}
      />,
    );

    expect(screen.queryByText("Nadia")).not.toBeInTheDocument();
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
});
