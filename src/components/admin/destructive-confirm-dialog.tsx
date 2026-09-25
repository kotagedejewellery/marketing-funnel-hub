"use client";

import { useEffect, useId, useRef } from "react";

export function DestructiveConfirmDialog({
  open,
  count,
  pending,
  onClose,
  onConfirm,
}: {
  open: boolean;
  count: number;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      cancelRef.current?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        if (pending) event.preventDefault();
      }}
      onClose={() => {
        if (!pending) onClose();
      }}
      className="kgj-admin-dialog m-auto w-[min(30rem,calc(100vw-2rem))] rounded-2xl border-0 bg-card p-0 text-foreground shadow-[0_24px_80px_-24px_rgba(40,33,28,0.5)] backdrop:bg-[rgba(40,33,28,0.6)]"
    >
      <div className="p-6 sm:p-8">
        <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-5"
          >
            <path d="M12 9v4m0 4h.01M10.3 3.9 2.9 17.2A2 2 0 0 0 4.65 20h14.7a2 2 0 0 0 1.75-2.8L13.7 3.9a2 2 0 0 0-3.4 0Z" />
          </svg>
        </div>
        <h2 id={titleId} className="mt-5 font-serif text-2xl font-bold">
          Hapus {count} ulasan secara permanen?
        </h2>
        <p
          id={descriptionId}
          className="mt-3 text-sm leading-6 text-muted-foreground"
        >
          Ulasan yang dihapus tidak dapat dikembalikan. Pastikan hanya ulasan
          dummy atau yang memang tidak diperlukan yang dipilih.
        </p>
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            disabled={pending}
            className="min-h-11 rounded-full border border-border bg-card px-5 text-sm font-bold hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            aria-busy={pending || undefined}
            className="min-h-11 rounded-full bg-destructive px-5 text-sm font-bold text-destructive-foreground hover:bg-destructive/90 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-50"
          >
            {pending ? "Menghapus..." : `Hapus ${count} ulasan`}
          </button>
        </div>
      </div>
    </dialog>
  );
}
