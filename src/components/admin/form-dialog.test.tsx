import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FormDialog } from "./form-dialog";
import { PageDataManagerProvider } from "./page-data-manager-context";

describe("FormDialog", () => {
  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = function showModal() {
      this.setAttribute("open", "");
    };
    HTMLDialogElement.prototype.close = function close() {
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    };
  });

  it("announces a branch source save only from an open source dialog", () => {
    const sourceSaved = vi.fn();
    window.addEventListener("kgj:branch-source-saved", sourceSaved);
    render(
      <FormDialog
        title="Galeri produk"
        triggerLabel="Galeri produk"
        refreshBuilderData
      >
        <p>Isi galeri</p>
      </FormDialog>,
    );

    window.dispatchEvent(new Event("kgj:admin-saved"));
    expect(sourceSaved).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Galeri produk" }));
    window.dispatchEvent(new Event("kgj:admin-saved"));

    expect(sourceSaved).toHaveBeenCalledTimes(1);
    window.removeEventListener("kgj:branch-source-saved", sourceSaved);
  });

  it("renders the relevant manager inline when selected from the builder drawer", () => {
    const sourceSaved = vi.fn();
    window.addEventListener("kgj:branch-source-saved", sourceSaved);
    render(
      <PageDataManagerProvider selection={{ tool: "gallery" }}>
        <FormDialog
          title="Galeri produk"
          triggerLabel="Atur galeri produk"
          dataTool="gallery"
          refreshBuilderData
        >
          <p>Isi galeri</p>
        </FormDialog>
      </PageDataManagerProvider>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Isi galeri")).toBeVisible();

    window.dispatchEvent(new Event("kgj:admin-saved"));

    expect(sourceSaved).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Isi galeri")).toBeVisible();
    window.removeEventListener("kgj:branch-source-saved", sourceSaved);
  });

  it("selects a manager from the source drawer without opening another dialog", () => {
    const onSelect = vi.fn();
    render(
      <PageDataManagerProvider selection={null} onSelect={onSelect}>
        <FormDialog
          title="Galeri produk"
          triggerLabel="Atur galeri produk"
          dataTool="gallery"
        >
          <p>Isi galeri</p>
        </FormDialog>
      </PageDataManagerProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Atur galeri produk" }));

    expect(onSelect).toHaveBeenCalledWith({ tool: "gallery" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
