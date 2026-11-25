"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

export function SignOutButton() {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  function closeDialog() {
    if (pending) return;
    dialogRef.current?.close();
    setOpen(false);
  }

  useEffect(() => {
    if (!open || dialogRef.current?.open) return;
    dialogRef.current?.showModal();
    cancelRef.current?.focus();
  }, [open]);

  async function signOut() {
    setPending(true);
    setError(false);
    try {
      const response = await fetch("/api/admin/session", { method: "DELETE" });
      if (!response.ok) {
        setError(true);
        return;
      }
      router.replace("/admin/login");
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <span className="flex w-full flex-col gap-1">
      <button
        type="button"
        onClick={() => {
          setError(false);
          setOpen(true);
        }}
        className="min-h-11 w-full rounded-full bg-secondary px-5 text-sm font-semibold transition-colors hover:bg-[var(--kgj-accent-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
      >
        Keluar
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onCancel={(event) => {
          if (pending) event.preventDefault();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeDialog();
        }}
        onClose={() => setOpen(false)}
        className="kgj-admin-dialog m-auto w-[min(30rem,calc(100vw-2rem))] rounded-2xl border-0 bg-card p-0 text-foreground shadow-[0_24px_80px_-24px_rgba(40,33,28,0.5)] backdrop:bg-[rgba(40,33,28,0.6)]"
      >
        <div className="p-6 sm:p-8">
          <h2 id={titleId} className="font-serif text-2xl font-bold">
            Keluar dari dashboard?
          </h2>
          <p
            id={descriptionId}
            className="mt-3 text-sm leading-6 text-muted-foreground"
          >
            Sesi Anda pada perangkat ini akan diakhiri. Anda dapat masuk kembali
            kapan saja.
          </p>
          {error && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              Gagal keluar. Coba lagi.
            </p>
          )}
          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              ref={cancelRef}
              type="button"
              onClick={closeDialog}
              disabled={pending}
              className="min-h-11 rounded-full border border-border bg-card px-5 text-sm font-bold hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={signOut}
              disabled={pending}
              aria-busy={pending || undefined}
              className="min-h-11 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-[var(--kgj-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-50"
            >
              {pending ? "Keluar..." : "Keluar"}
            </button>
          </div>
        </div>
      </dialog>
    </span>
  );
}
