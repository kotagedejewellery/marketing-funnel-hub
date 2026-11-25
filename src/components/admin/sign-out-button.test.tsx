import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => router }));

import { SignOutButton } from "./sign-out-button";

beforeEach(() => {
  router.replace.mockReset();
  router.refresh.mockReset();
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
  global.fetch = vi.fn();
});

describe("SignOutButton", () => {
  it("requires confirmation before ending the admin session", async () => {
    const fetchMock = vi.mocked(global.fetch);
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true })));
    render(<SignOutButton />);

    fireEvent.click(screen.getByRole("button", { name: "Keluar" }));

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: "Keluar dari CMS?" }),
    ).toBeVisible();
    expect(within(dialog).getByRole("button", { name: "Batal" })).toHaveFocus();
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole("button", { name: "Batal" }));
    expect(dialog).not.toHaveAttribute("open");
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Keluar" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Keluar" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/admin/session", {
        method: "DELETE",
      }),
    );
    expect(router.replace).toHaveBeenCalledWith("/admin/login");
    expect(router.refresh).toHaveBeenCalledOnce();
  });

  it("keeps the dialog open and offers retry when logout fails", async () => {
    const fetchMock = vi.mocked(global.fetch);
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }));
    render(<SignOutButton />);

    fireEvent.click(screen.getByRole("button", { name: "Keluar" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Keluar" }));

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Gagal keluar. Coba lagi.",
    );
    expect(dialog).toHaveAttribute("open");
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("does not end the session when an unsaved-change guard cancels logout", () => {
    const preventLogout = (event: Event) => event.preventDefault();
    window.addEventListener("kgj:admin-before-logout", preventLogout);
    render(<SignOutButton />);

    fireEvent.click(screen.getByRole("button", { name: "Keluar" }));
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Keluar",
      }),
    );

    expect(global.fetch).not.toHaveBeenCalled();
    window.removeEventListener("kgj:admin-before-logout", preventLogout);
  });
});
