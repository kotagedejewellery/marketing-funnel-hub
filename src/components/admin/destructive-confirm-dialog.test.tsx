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
});
