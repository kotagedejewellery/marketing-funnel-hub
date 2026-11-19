import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DestructiveConfirmDialog } from "./destructive-confirm-dialog";

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

describe("DestructiveConfirmDialog", () => {
  it("names the selected review count and keeps cancel as the first action", () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    render(
      <DestructiveConfirmDialog
        open
        count={3}
        pending={false}
        onClose={onClose}
        onConfirm={onConfirm}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Hapus 3 ulasan secara permanen?" }),
    ).toBeVisible();
    expect(
      screen.getByText(/ulasan yang dihapus tidak dapat dikembalikan/i),
    ).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Batal" }));
    expect(onClose).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole("button", { name: "Hapus 3 ulasan" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("locks the irreversible action while deletion is pending", () => {
    render(
      <DestructiveConfirmDialog
        open
        count={1}
        pending
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Menghapus..." })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Menghapus..." }),
    ).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("button", { name: "Batal" })).toBeDisabled();
  });

  it("accepts explicit copy for another irreversible configuration change", () => {
    render(
      <DestructiveConfirmDialog
        open
        count={1}
        pending={false}
        title="Hapus konfigurasi Meta khusus?"
        description="Token yang dihapus harus dibuat ulang sebelum dapat digunakan."
        confirmLabel="Hapus konfigurasi khusus"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Hapus konfigurasi Meta khusus?" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Hapus konfigurasi khusus" }),
    ).toBeVisible();
  });

  it("requires the supplied page slug before confirming a page deletion", () => {
    const onConfirm = vi.fn();
    render(
      <DestructiveConfirmDialog
        open
        count={1}
        pending={false}
        title="Hapus halaman uji Surabaya?"
        description="Konten uji akan dihapus permanen."
        confirmLabel="Hapus halaman uji"
        confirmationValue="surabaya"
        confirmationInputName="confirmationSlug"
        confirmationFormId="delete-branch"
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    const confirm = screen.getByRole("button", {
      name: "Hapus halaman uji",
    });
    expect(confirm).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/ketik surabaya/i), {
      target: { value: "surabaya" },
    });
    expect(confirm).toBeEnabled();
  });

  it("clears the confirmation after the native dialog closes", () => {
    const onClose = vi.fn();
    render(
      <DestructiveConfirmDialog
        open
        count={1}
        pending={false}
        confirmationValue="surabaya"
        confirmationInputName="confirmationSlug"
        confirmationFormId="delete-branch"
        onClose={onClose}
        onConfirm={vi.fn()}
      />,
    );

    const confirm = screen.getByRole("button", { name: "Hapus 1 ulasan" });
    fireEvent.change(screen.getByLabelText(/ketik surabaya/i), {
      target: { value: "surabaya" },
    });
    expect(confirm).toBeEnabled();

    fireEvent(screen.getByRole("dialog"), new Event("close"));

    expect(onClose).toHaveBeenCalledOnce();
    expect(confirm).toBeDisabled();
  });
});
