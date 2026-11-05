"use client";

import { useActionState, useRef, useState } from "react";

import { FormFeedback } from "@/components/admin/admin-toast";
import { DestructiveConfirmDialog } from "@/components/admin/destructive-confirm-dialog";
import { PageOrderControls } from "@/components/admin/page-order-controls";
import {
  initializePageBlocks,
  resetPageBlocks,
} from "@/modules/admin/link-bio/layout-actions";

type LayoutBlock = {
  id: string;
  kind: "section" | "product" | "link";
  label: string;
  isActive: boolean;
  linkType?: string;
};

export function PageBlockOrder({
  branchId,
  blocks,
}: {
  branchId: string;
  blocks: LayoutBlock[];
}) {
  const [state, action, pending] = useActionState(initializePageBlocks, {
    message: "",
    ok: false,
  });
  const [resetState, resetAction, resetting] = useActionState(resetPageBlocks, {
    message: "",
    ok: false,
  });
  const resetFormRef = useRef<HTMLFormElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <section
      className="rounded-2xl bg-card p-6 sm:p-8"
      aria-labelledby="page-layout"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="page-layout" className="font-serif text-2xl">
            Susunan halaman
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Tempatkan setiap tombol WhatsApp produk atau tautan custom di antara
            konten halaman. Footer dan logo profil tetap berada pada posisinya.
          </p>
        </div>
      </div>
      {blocks.length === 0 ? (
        <form
          action={action}
          className="mt-5 flex flex-wrap items-center gap-3"
        >
          <input type="hidden" name="branchId" value={branchId} />
          <button
            type="submit"
            disabled={pending}
            aria-busy={pending || undefined}
            className="min-h-11 rounded-full bg-primary px-5 font-bold text-primary-foreground disabled:opacity-50"
          >
            {pending ? "Menyiapkan..." : "Aktifkan susunan kustom"}
          </button>
          <FormFeedback state={state} pending={pending} />
        </form>
      ) : (
        <>
          <ol className="mt-5 divide-y divide-border border-y border-border">
            {blocks.map((block, index) => (
              <li
                key={block.id}
                className="flex flex-wrap items-center justify-between gap-3 py-4"
              >
                <div>
                  <p className="font-semibold">{block.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {block.kind === "product"
                      ? "Tombol WhatsApp"
                      : block.kind === "link"
                        ? block.linkType === "social"
                          ? "Tautan sosial"
                          : block.linkType === "secondary"
                            ? "Tautan tambahan"
                            : "Tombol custom"
                        : "Bagian halaman"}
                    {block.isActive ? " · Tampil" : " · Disembunyikan"}
                  </p>
                </div>
                <PageOrderControls
                  kind="page_block"
                  id={block.id}
                  branchId={branchId}
                  index={index}
                  count={blocks.length}
                />
              </li>
            ))}
          </ol>
          <form ref={resetFormRef} action={resetAction} className="mt-5">
            <input type="hidden" name="branchId" value={branchId} />
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="min-h-11 rounded-full border border-destructive px-5 text-sm font-bold text-destructive hover:bg-destructive/10 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Kembalikan ke susunan template
            </button>
            <FormFeedback state={resetState} pending={resetting} />
          </form>
          <DestructiveConfirmDialog
            open={confirmReset && !resetState.ok}
            count={1}
            pending={resetting}
            onClose={() => setConfirmReset(false)}
            onConfirm={() => resetFormRef.current?.requestSubmit()}
            title="Kembalikan susunan template?"
            description="Urutan tombol dan bagian kustom cabang ini akan dihapus. Tombol, tautan, serta seluruh konten cabang tetap tersimpan."
            confirmLabel="Kembalikan susunan"
            pendingLabel="Mengembalikan..."
          />
        </>
      )}
    </section>
  );
}
