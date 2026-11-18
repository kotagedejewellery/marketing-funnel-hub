import { StrictMode } from "react";
import Link from "next/link";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BranchPageBuilder } from "./branch-page-builder";

const actions = vi.hoisted(() => ({
  publishPageBuilder: vi.fn(),
  savePageBuilderDraft: vi.fn(),
}));
const router = vi.hoisted(() => ({ refresh: vi.fn() }));

vi.mock("@/modules/page-builder/actions", () => actions);
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const emptyDataTools = {
  identity: null,
  sections: null,
  campaigns: null,
  gallery: null,
  cta: null,
  reviews: null,
  faq: null,
  links: null,
  formResponses: null,
  tracking: null,
};

describe("BranchPageBuilder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps connected data controls inside the builder workspace and saves its draft", async () => {
    actions.savePageBuilderDraft.mockResolvedValue({
      ok: true,
      message: "Draft builder tersimpan.",
    });

    render(
      <BranchPageBuilder
        branchId="branch-1"
        branchName="KGJ Pusat"
        initialBlocks={[
          {
            id: "block-1",
            type: "rich_text",
            text: "Halo",
            width: "full",
            isVisible: true,
          },
        ]}
        catalog={{
          sections: [{ sectionKey: "faq", label: "FAQ" }],
          products: [],
          links: [],
          sourceSummary: [
            { id: "gallery", label: "Galeri produk", detail: "2 aktif" },
            { id: "cta", label: "CTA WhatsApp", detail: "1 aktif" },
          ],
        }}
        dataTools={{
          ...emptyDataTools,
          reviews: <button type="button">Atur ulasan Google</button>,
        }}
        preview={<p>Pratinjau tersimpan</p>}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Builder Link Bio" }),
    ).toBeVisible();
    expect(screen.getByText("Kanvas halaman")).toBeVisible();
    expect(screen.getByText("Pratinjau tersimpan")).toBeVisible();

    fireEvent.click(
      screen.getAllByRole("button", { name: "Semua data halaman" })[0],
    );
    expect(
      screen.getByRole("heading", { name: "Semua data halaman" }),
    ).toBeVisible();
    expect(screen.getByText("Galeri produk")).toBeVisible();
    expect(screen.getByText("2 aktif")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Atur ulasan Google" }),
    ).toBeVisible();

    const sourceDataTitle = screen.getByRole("heading", {
      name: "Semua data halaman",
    });
    expect(sourceDataTitle).toHaveFocus();
    expect(sourceDataTitle.closest("[role=dialog]")).toHaveAttribute(
      "aria-modal",
      "true",
    );
    expect(sourceDataTitle.closest("[role=dialog]")?.parentElement).toHaveClass(
      "kgj-admin",
    );
    expect(
      screen
        .getByRole("heading", { name: "Builder Link Bio", hidden: true })
        .closest("section")?.parentElement,
    ).toHaveProperty("inert", true);

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getAllByRole("button", { name: "Semua data halaman" })[0],
      ).toHaveFocus(),
    );

    window.dispatchEvent(new Event("kgj:branch-source-saved"));
    await waitFor(() => expect(router.refresh).toHaveBeenCalled());
    router.refresh.mockClear();

    fireEvent.click(screen.getByRole("button", { name: "Simpan draft" }));
    await waitFor(() =>
      expect(actions.savePageBuilderDraft).toHaveBeenCalledWith("branch-1", [
        expect.objectContaining({ id: "block-1", type: "rich_text" }),
      ]),
    );
    expect(await screen.findByText("Draft builder tersimpan.")).toBeVisible();
    expect(router.refresh).not.toHaveBeenCalled();
  });

  it("keeps the source-data drawer open during development strict effects", () => {
    render(
      <StrictMode>
        <BranchPageBuilder
          branchId="branch-1"
          branchName="KGJ Pusat"
          initialBlocks={[]}
          catalog={{ sections: [], products: [], links: [], sourceSummary: [] }}
          dataTools={emptyDataTools}
          preview={null}
        />
      </StrictMode>,
    );

    fireEvent.click(
      screen.getAllByRole("button", { name: "Semua data halaman" })[0],
    );

    expect(
      screen.getByRole("heading", { name: "Semua data halaman" }),
    ).toBeVisible();
  });

  it("shows only the selected block's data manager", () => {
    render(
      <BranchPageBuilder
        branchId="branch-1"
        branchName="KGJ Pusat"
        initialBlocks={[
          {
            id: "block-1",
            type: "section",
            sectionKey: "products",
            width: "full",
            isVisible: true,
          },
        ]}
        catalog={{
          sections: [],
          products: [],
          links: [],
          sourceSummary: [
            { id: "cta", label: "CTA WhatsApp", detail: "1 aktif" },
            { id: "gallery", label: "Galeri produk", detail: "2 aktif" },
          ],
        }}
        dataTools={{
          ...emptyDataTools,
          cta: <button type="button">Atur CTA WhatsApp</button>,
          gallery: <button type="button">Atur galeri produk</button>,
        }}
        preview={null}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /Atur Pengaturan section/i }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Atur CTA WhatsApp/i }));

    const sourceDataTitle = screen.getByRole("heading", {
      name: "Atur CTA WhatsApp",
    });
    expect(sourceDataTitle).toBeVisible();
    expect(sourceDataTitle).toHaveFocus();
    expect(
      within(screen.getByRole("dialog")).getByText("1 aktif"),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Atur galeri produk" }),
    ).not.toBeInTheDocument();
  });

  it("offers keyboard-accessible controls to reorder blocks", () => {
    render(
      <BranchPageBuilder
        branchId="branch-1"
        branchName="KGJ Pusat"
        initialBlocks={[
          {
            id: "block-1",
            type: "rich_text",
            text: "Halo",
            width: "full",
            isVisible: true,
          },
          {
            id: "block-2",
            type: "spacer",
            size: "md",
            showDivider: false,
            width: "full",
            isVisible: true,
          },
        ]}
        catalog={{ sections: [], products: [], links: [], sourceSummary: [] }}
        dataTools={emptyDataTools}
        preview={null}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Naikkan Pemisah & jarak" }),
    );

    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent(
      "Pemisah & jarak",
    );
  });

  it("keeps form field keys internal and offers plain-language question types", () => {
    render(
      <BranchPageBuilder
        branchId="branch-1"
        branchName="KGJ Pusat"
        initialBlocks={[
          {
            id: "block-1",
            type: "form",
            title: "Konsultasi",
            description: "",
            submitLabel: "Kirim",
            privacyNotice: "Data disimpan KGJ.",
            assignmentId: "assignment-1",
            fields: [
              {
                id: "field-1",
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
        ]}
        catalog={{
          sections: [],
          products: [
            {
              id: "product-1",
              name: "Cincin",
              assignment: { id: "assignment-1" },
            },
          ],
          links: [],
          sourceSummary: [],
        }}
        dataTools={emptyDataTools}
        preview={null}
      />,
    );

    expect(screen.queryByText("Nama sistem")).not.toBeInTheDocument();
    expect(screen.getByText("Jenis jawaban")).toBeVisible();
    expect(screen.getByLabelText("CTA WhatsApp tujuan")).toHaveValue(
      "assignment-1",
    );
    expect(screen.getByRole("option", { name: "Cincin" })).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Lihat respons form ini" }),
    ).toHaveAttribute(
      "href",
      "/admin/form-responses?branchId=branch-1&formId=block-1",
    );
    expect(screen.getByRole("button", { name: /Nama lengkap/i })).toBeVisible();
    fireEvent.change(screen.getByLabelText("Jenis jawaban"), {
      target: { value: "select" },
    });
    expect(screen.getByLabelText("Pilihan (satu per baris)")).toHaveValue(
      "Pilihan 1\nPilihan 2",
    );
  });

  it("routes form setup to CTA management when this branch has no active CTA", () => {
    render(
      <BranchPageBuilder
        branchId="branch-1"
        branchName="KGJ Pusat"
        initialBlocks={[]}
        catalog={{ sections: [], products: [], links: [], sourceSummary: [] }}
        dataTools={{
          ...emptyDataTools,
          cta: <button type="button">Atur CTA WhatsApp</button>,
        }}
        preview={null}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "+ Form (perlu CTA)" }));

    expect(
      screen.getByRole("heading", { name: "Atur CTA WhatsApp" }),
    ).toBeVisible();
    expect(screen.queryByText("Konsultasi")).not.toBeInTheDocument();
  });

  it("returns focus to Form setup after CTA management is closed", async () => {
    render(
      <BranchPageBuilder
        branchId="branch-1"
        branchName="KGJ Pusat"
        initialBlocks={[]}
        catalog={{ sections: [], products: [], links: [], sourceSummary: [] }}
        dataTools={{
          ...emptyDataTools,
          cta: <button type="button">Atur CTA WhatsApp</button>,
        }}
        preview={null}
      />,
    );

    const formSetup = screen.getByRole("button", {
      name: "+ Form (perlu CTA)",
    });
    fireEvent.click(formSetup);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    await waitFor(() => expect(formSetup).toHaveFocus());
  });

  it("names the initial CTA chosen for a new form", () => {
    render(
      <BranchPageBuilder
        branchId="branch-1"
        branchName="KGJ Pusat"
        initialBlocks={[]}
        catalog={{
          sections: [],
          products: [
            {
              id: "product-1",
              name: "Cincin",
              assignment: { id: "4f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4" },
            },
          ],
          links: [],
          sourceSummary: [],
        }}
        dataTools={emptyDataTools}
        preview={null}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "+ Form" }));

    expect(
      screen.getByText(
        "CTA saat ini: Cincin. Ubah jika form ditujukan ke CTA lain.",
      ),
    ).toBeVisible();
  });

  it("explains how to repair an existing form whose CTA is no longer active", () => {
    render(
      <BranchPageBuilder
        branchId="branch-1"
        branchName="KGJ Pusat"
        initialBlocks={[
          {
            id: "block-1",
            type: "form",
            title: "Konsultasi",
            description: "",
            submitLabel: "Kirim",
            privacyNotice: "Data disimpan KGJ.",
            assignmentId: "00000000-0000-0000-0000-000000000000",
            fields: [
              {
                id: "field-1",
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
        ]}
        catalog={{ sections: [], products: [], links: [], sourceSummary: [] }}
        dataTools={{
          ...emptyDataTools,
          cta: <button type="button">Atur CTA WhatsApp</button>,
        }}
        preview={null}
      />,
    );

    expect(
      screen.getByText("CTA WhatsApp tujuan belum tersedia."),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Atur CTA WhatsApp" }));
    expect(
      screen.getByRole("heading", { name: "Atur CTA WhatsApp" }),
    ).toBeVisible();
  });

  it("asks Marketing to choose a replacement when a form CTA is no longer active", () => {
    render(
      <BranchPageBuilder
        branchId="branch-1"
        branchName="KGJ Pusat"
        initialBlocks={[
          {
            id: "block-1",
            type: "form",
            title: "Konsultasi",
            description: "",
            submitLabel: "Kirim",
            privacyNotice: "Data disimpan KGJ.",
            assignmentId: "00000000-0000-0000-0000-000000000000",
            fields: [
              {
                id: "field-1",
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
        ]}
        catalog={{
          sections: [],
          products: [
            {
              id: "product-1",
              name: "Cincin",
              assignment: { id: "assignment-1" },
            },
          ],
          links: [],
          sourceSummary: [],
        }}
        dataTools={emptyDataTools}
        preview={null}
      />,
    );

    expect(screen.getByLabelText("CTA WhatsApp tujuan")).toHaveValue("");
    expect(
      screen.getByRole("option", { name: "Pilih CTA WhatsApp tujuan" }),
    ).toBeVisible();
  });

  it("explains the limits of custom HTML in plain language", () => {
    render(
      <BranchPageBuilder
        branchId="branch-1"
        branchName="KGJ Pusat"
        initialBlocks={[
          {
            id: "block-1",
            type: "html",
            html: "<p>Halo</p>",
            width: "full",
            isVisible: true,
          },
        ]}
        catalog={{ sections: [], products: [], links: [], sourceSummary: [] }}
        dataTools={emptyDataTools}
        preview={null}
      />,
    );

    expect(screen.getByRole("button", { name: "+ HTML kustom" })).toBeVisible();
    expect(screen.getByLabelText("Kode HTML")).toHaveValue("<p>Halo</p>");
    expect(screen.getByText(/Script, iframe/i)).toBeVisible();
  });

  it("reorders blocks with a touch drag handle", () => {
    const { container } = render(
      <BranchPageBuilder
        branchId="branch-1"
        branchName="KGJ Pusat"
        initialBlocks={[
          {
            id: "block-1",
            type: "rich_text",
            text: "Halo",
            width: "full",
            isVisible: true,
          },
          {
            id: "block-2",
            type: "spacer",
            size: "md",
            showDivider: false,
            width: "full",
            isVisible: true,
          },
        ]}
        catalog={{ sections: [], products: [], links: [], sourceSummary: [] }}
        dataTools={emptyDataTools}
        preview={null}
      />,
    );
    const items = screen.getAllByRole("listitem");
    Object.defineProperty(document, "elementFromPoint", {
      configurable: true,
      value: () => items[1],
    });
    const handle = container.querySelector("[data-builder-drag-handle]");

    fireEvent.pointerDown(handle!, { pointerId: 1, pointerType: "touch" });
    fireEvent.pointerMove(handle!, {
      pointerId: 1,
      pointerType: "touch",
      clientX: 10,
      clientY: 80,
    });
    fireEvent.pointerUp(handle!, { pointerId: 1, pointerType: "touch" });

    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent(
      "Pemisah & jarak",
    );
  });

  it("edits a legacy spacer with a precise vertical gap and divider", async () => {
    actions.savePageBuilderDraft.mockResolvedValue({
      ok: true,
      message: "Draft builder tersimpan.",
    });
    render(
      <BranchPageBuilder
        branchId="branch-1"
        branchName="KGJ Pusat"
        initialBlocks={[
          {
            id: "block-1",
            type: "spacer",
            size: "lg",
            showDivider: false,
            width: "full",
            isVisible: true,
          },
        ]}
        catalog={{ sections: [], products: [], links: [], sourceSummary: [] }}
        dataTools={emptyDataTools}
        preview={null}
      />,
    );

    expect(screen.getByText("64 px")).toBeVisible();
    fireEvent.change(screen.getByLabelText("Isi jarak dalam piksel"), {
      target: { value: "37" },
    });
    fireEvent.click(screen.getByLabelText("Tampilkan garis pemisah"));

    expect(screen.getByText("37 px")).toBeVisible();
    expect(screen.getByText("Perubahan belum disimpan")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Simpan draft" }));
    await waitFor(() =>
      expect(actions.savePageBuilderDraft).toHaveBeenCalledWith("branch-1", [
        expect.objectContaining({ spacingPx: 37, showDivider: true }),
      ]),
    );
  });

  it("lets a deleted block be restored before the draft is saved", () => {
    render(
      <BranchPageBuilder
        branchId="branch-1"
        branchName="KGJ Pusat"
        initialBlocks={[
          {
            id: "block-1",
            type: "rich_text",
            text: "Halo",
            width: "full",
            isVisible: true,
          },
        ]}
        catalog={{ sections: [], products: [], links: [], sourceSummary: [] }}
        dataTools={emptyDataTools}
        preview={null}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));
    expect(screen.getByText("Blok dihapus dari draft.")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Urungkan" }));

    expect(screen.getByLabelText("Teks")).toHaveValue("Halo");
  });

  it("restores the save controls after an action failure", async () => {
    actions.savePageBuilderDraft.mockRejectedValue(new Error("offline"));

    render(
      <BranchPageBuilder
        branchId="branch-1"
        branchName="KGJ Pusat"
        initialBlocks={[]}
        catalog={{ sections: [], products: [], links: [], sourceSummary: [] }}
        dataTools={emptyDataTools}
        preview={null}
      />,
    );

    const save = screen.getByRole("button", { name: "Simpan draft" });
    fireEvent.click(save);

    expect(
      await screen.findByText(/Penyimpanan belum berhasil/i),
    ).toBeVisible();
    expect(save).toBeEnabled();
  });

  it("groups a continuous text edit into one undo step", () => {
    render(
      <BranchPageBuilder
        branchId="branch-1"
        branchName="KGJ Pusat"
        initialBlocks={[
          {
            id: "block-1",
            type: "rich_text",
            text: "Halo",
            width: "full",
            isVisible: true,
          },
        ]}
        catalog={{ sections: [], products: [], links: [], sourceSummary: [] }}
        dataTools={emptyDataTools}
        preview={null}
      />,
    );

    const text = screen.getByLabelText("Teks");
    fireEvent.change(text, { target: { value: "Halo satu" } });
    fireEvent.change(text, { target: { value: "Halo dua" } });
    fireEvent.click(screen.getByRole("button", { name: "Batalkan" }));

    expect(text).toHaveValue("Halo");
  });

  it("warns before the browser discards an unsaved draft", () => {
    render(
      <BranchPageBuilder
        branchId="branch-1"
        branchName="KGJ Pusat"
        initialBlocks={[
          {
            id: "block-1",
            type: "rich_text",
            text: "Halo",
            width: "full",
            isVisible: true,
          },
        ]}
        catalog={{ sections: [], products: [], links: [], sourceSummary: [] }}
        dataTools={emptyDataTools}
        preview={null}
      />,
    );

    fireEvent.change(screen.getByLabelText("Teks"), {
      target: { value: "Berubah" },
    });
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it("asks before an internal link leaves an unsaved draft", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(
      <BranchPageBuilder
        branchId="branch-1"
        branchName="KGJ Pusat"
        initialBlocks={[
          {
            id: "block-1",
            type: "rich_text",
            text: "Halo",
            width: "full",
            isVisible: true,
          },
        ]}
        catalog={{ sections: [], products: [], links: [], sourceSummary: [] }}
        dataTools={emptyDataTools}
        preview={<Link href="/admin/branches">Keluar builder</Link>}
      />,
    );

    fireEvent.change(screen.getByLabelText("Teks"), {
      target: { value: "Berubah" },
    });
    const navigation = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      button: 0,
    });
    screen
      .getByRole("link", { name: "Keluar builder" })
      .dispatchEvent(navigation);

    expect(confirm).toHaveBeenCalledWith(
      "Perubahan draft belum disimpan. Tetap keluar?",
    );
    expect(navigation.defaultPrevented).toBe(true);
  });

  it("shows publication readiness before Marketing tries to publish", () => {
    render(
      <BranchPageBuilder
        branchId="branch-1"
        branchName="KGJ Pusat"
        initialBlocks={[
          {
            id: "block-1",
            type: "rich_text",
            text: "Halo",
            width: "full",
            isVisible: true,
          },
        ]}
        catalog={{ sections: [], products: [], links: [], sourceSummary: [] }}
        dataTools={emptyDataTools}
        preview={null}
      />,
    );

    expect(screen.getByText("Belum siap diterbitkan")).toBeVisible();
    expect(
      screen.getByText(
        /Tambahkan minimal satu CTA WhatsApp produk yang tampil/i,
      ),
    ).toBeVisible();
  });

  it("blocks saving when a block refers to data that is no longer active", () => {
    render(
      <BranchPageBuilder
        branchId="branch-1"
        branchName="KGJ Pusat"
        initialBlocks={[
          {
            id: "3f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
            type: "product_cta",
            assignmentId: "4f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
            width: "full",
            isVisible: true,
          },
        ]}
        catalog={{ sections: [], products: [], links: [], sourceSummary: [] }}
        dataTools={emptyDataTools}
        preview={null}
      />,
    );

    expect(screen.getByText("Belum siap diterbitkan")).toBeVisible();
    expect(
      screen.getByText(
        "CTA WhatsApp untuk blok ini sudah tidak aktif. Atur data terkait terlebih dahulu.",
      ),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Simpan draft" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Terbitkan perubahan" }),
    ).toBeDisabled();
  });

  it("marks a valid visible WhatsApp CTA as ready to publish", () => {
    render(
      <BranchPageBuilder
        branchId="branch-1"
        branchName="KGJ Pusat"
        initialBlocks={[
          {
            id: "3f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
            type: "product_cta",
            assignmentId: "4f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4",
            width: "full",
            isVisible: true,
          },
        ]}
        catalog={{
          sections: [],
          products: [
            {
              id: "product-1",
              name: "Cincin",
              assignment: { id: "4f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4" },
            },
          ],
          links: [],
          sourceSummary: [],
        }}
        dataTools={emptyDataTools}
        preview={null}
      />,
    );

    expect(screen.getByText("Siap diterbitkan")).toBeVisible();
  });
});
