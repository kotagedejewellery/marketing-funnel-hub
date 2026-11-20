import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BuilderForm } from "./builder-form";

const block = {
  id: "3f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
  type: "form" as const,
  width: "full" as const,
  isVisible: true,
  title: "Konsultasi",
  description: "Isi data Anda.",
  submitLabel: "Kirim data",
  privacyNotice: "Data disimpan oleh KGJ.",
  assignmentId: "4f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
  fields: [
    {
      id: "5f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
      name: "nama",
      label: "Nama",
      type: "text" as const,
      placeholder: "",
      help: "",
      required: true,
      options: [],
    },
  ],
};

const product = {
  id: "product-1",
  assignmentId: block.assignmentId,
  name: "Cincin",
  slug: "cincin",
  description: null,
  branches: [
    {
      id: block.assignmentId,
      name: "Pusat",
      slug: "pusat",
      ctaLabel: "Chat Cincin",
      whatsappUrl: "https://wa.me/628111111111",
      metaEventName: null,
    },
  ],
};

describe("BuilderForm", () => {
  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = function showModal() {
      this.setAttribute("open", "");
    };
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          whatsappUrl: "https://wa.me/628111111111",
          ctaLabel: "Chat Cincin",
          continuationToken: "opaque-token",
        }),
      ),
    );
  });

  it("shows a thank-you dialog only after the response is saved", async () => {
    render(
      <main id="main-content">
        <BuilderForm block={block} branchSlug="pusat" product={product} />
      </main>,
    );

    fireEvent.change(screen.getByLabelText("Nama *"), {
      target: { value: "Nadia" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: "Kirim data" }).closest("form")!,
    );

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Terima kasih");
    expect(
      within(dialog).getByRole("link", { name: "Lanjut ke WhatsApp" }),
    ).toHaveAttribute("data-track", "whatsapp");
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    const continueLink = within(dialog).getByRole("link", {
      name: "Lanjut ke WhatsApp",
    });
    continueLink.addEventListener("click", (event) => event.preventDefault());
    fireEvent.click(continueLink);
    await waitFor(() =>
      expect(global.fetch).toHaveBeenLastCalledWith(
        "/api/forms/pusat/3f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4/continue",
        expect.objectContaining({
          method: "POST",
          keepalive: true,
          body: JSON.stringify({ continuationToken: "opaque-token" }),
        }),
      ),
    );
  });

  it("renders the configured submit button layout", () => {
    render(
      <BuilderForm
        block={{
          ...block,
          submitButtonAlign: "center",
          submitButtonWidth: "full",
          submitButtonStyle: "soft",
        }}
        branchSlug="pusat"
        product={product}
      />,
    );

    const submit = screen.getByRole("button", { name: "Kirim data" });
    expect(submit).toHaveClass("w-full", "bg-[var(--kgj-accent-soft)]");
    expect(submit.parentElement).toHaveClass("justify-center");
  });

  it.each([
    ["judul dan deskripsi tampil", {}, true, true],
    ["hanya judul tersembunyi", { showTitle: false }, false, true],
    ["hanya deskripsi tersembunyi", { showDescription: false }, true, false],
    [
      "judul dan deskripsi tersembunyi",
      { showTitle: false, showDescription: false },
      false,
      false,
    ],
  ])(
    "renders form introduction when %s",
    (_state, visibility, hasTitle, hasDescription) => {
      render(
        <BuilderForm
          block={{ ...block, ...visibility }}
          branchSlug="pusat"
          product={product}
        />,
      );

      expect(screen.queryByRole("heading", { name: "Konsultasi" })).toEqual(
        hasTitle ? expect.anything() : null,
      );
      expect(screen.queryByText("Isi data Anda.")).toEqual(
        hasDescription ? expect.anything() : null,
      );
      expect(screen.getByRole("form", { name: "Konsultasi" })).toBeVisible();
    },
  );
});
