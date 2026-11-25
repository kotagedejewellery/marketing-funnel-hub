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

import { AccountMenu } from "./account-menu";

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

describe("AccountMenu", () => {
  it("keeps a pending logout dialog open when Escape is pressed", async () => {
    let resolveRequest: (response: Response) => void;
    vi.mocked(global.fetch).mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveRequest = resolve;
        }),
    );
    render(<AccountMenu displayName="Admin KGJ" role="admin" variant="bar" />);

    fireEvent.click(screen.getByRole("button", { name: "Akun" }));
    fireEvent.click(screen.getByRole("button", { name: "Keluar" }));

    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Keluar" }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledOnce());

    fireEvent.keyDown(dialog, { key: "Escape" });

    expect(dialog).toHaveAttribute("open");
    expect(screen.getByText("Admin KGJ")).toBeVisible();

    resolveRequest!(new Response(JSON.stringify({ ok: true })));
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/admin/login"),
    );
  });
});
