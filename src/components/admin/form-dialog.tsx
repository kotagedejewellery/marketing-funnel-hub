"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";

const FormDialogContext = createContext<() => void>(() => {});

export function useCloseFormDialog() {
  return useContext(FormDialogContext);
}

export function FormDialog({
  title,
  triggerLabel,
  children,
  primary = false,
  initiallyOpen = false,
}: {
  title: string;
  triggerLabel: string;
  children: ReactNode;
  primary?: boolean;
  initiallyOpen?: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const closeDialog = useCallback(() => {
    dialogRef.current?.close();
    setOpen(false);
  }, []);

  useEffect(() => {
    if (open && !dialogRef.current?.open) {
      dialogRef.current?.showModal();
      closeRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    window.addEventListener("kgj:admin-saved", closeDialog);
    return () => window.removeEventListener("kgj:admin-saved", closeDialog);
  }, [closeDialog]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 ${primary ? "bg-primary text-primary-foreground hover:bg-[var(--kgj-accent)]" : "border border-border bg-card hover:border-[var(--kgj-accent)] hover:bg-secondary"}`}
      >
        {triggerLabel}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClose={() => setOpen(false)}
        className="kgj-admin-dialog m-auto max-h-[calc(100dvh-2rem)] w-[min(48rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border-0 bg-card p-0 text-foreground shadow-[0_24px_80px_-24px_rgba(40,33,28,0.5)] backdrop:bg-[rgba(40,33,28,0.6)]"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-card px-6 py-4 sm:px-8">
          <h2 id={titleId} className="font-serif text-2xl font-bold">
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={closeDialog}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground hover:bg-[var(--kgj-accent-soft)] focus-visible:outline-2 focus-visible:outline-offset-2"
            aria-label="Tutup dialog"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              className="size-5"
            >
              <path d="M5 5 19 19 M19 5 5 19" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-6 sm:px-8">
          {open ? (
            <FormDialogContext.Provider value={closeDialog}>
              {children}
            </FormDialogContext.Provider>
          ) : null}
        </div>
      </dialog>
    </>
  );
}
