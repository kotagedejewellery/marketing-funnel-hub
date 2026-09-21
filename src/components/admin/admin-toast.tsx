"use client";

import { usePathname, useSearchParams } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useCloseFormDialog } from "@/components/admin/form-dialog";

const ToastContext = createContext<(message: string) => void>(() => {});

const savedMessages: Record<string, string> = {
  branches: "Cabang berhasil disimpan.",
  campaigns: "Kampanye berhasil disimpan.",
  links: "Tautan berhasil disimpan.",
  products: "Produk berhasil disimpan.",
  profiles: "Profil admin berhasil disimpan.",
};

export function AdminToastProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<{ message: string; id: number } | null>(
    null,
  );
  const showSuccess = useCallback((message: string) => {
    setNotice((current) => ({ message, id: (current?.id ?? 0) + 1 }));
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  return (
    <ToastContext.Provider value={showSuccess}>
      {children}
      {notice && (
        <ToastNotice
          kind="success"
          message={notice.message}
          onClose={() => setNotice(null)}
        />
      )}
    </ToastContext.Provider>
  );
}

export function RedirectSaveToast() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const showSuccess = useContext(ToastContext);
  const handledUrl = useRef("");

  useEffect(() => {
    if (searchParams.get("saved") !== "1") {
      handledUrl.current = "";
      return;
    }
    const message = savedMessages[pathname.split("/")[2]];
    if (!message) return;
    const currentUrl = `${pathname}?${searchParams.toString()}`;
    if (handledUrl.current === currentUrl) return;
    handledUrl.current = currentUrl;

    showSuccess(message);
    window.dispatchEvent(new Event("kgj:admin-saved"));
    const url = new URL(window.location.href);
    url.searchParams.delete("saved");
    window.history.replaceState(window.history.state, "", url);
  }, [pathname, searchParams, showSuccess]);

  return null;
}

export function FormFeedback({
  state,
  pending,
}: {
  state: { message: string; ok?: boolean };
  pending: boolean;
}) {
  const closeDialog = useCloseFormDialog();
  const showSuccess = useContext(ToastContext);
  const [dismissedError, setDismissedError] = useState<typeof state | null>(
    null,
  );

  useEffect(() => {
    if (!state.ok) return;
    closeDialog();
    showSuccess(state.message);
  }, [state, closeDialog, showSuccess]);

  if (!state.message || state.ok || pending || dismissedError === state) {
    return null;
  }
  return (
    <ToastNotice
      kind="error"
      message={state.message}
      onClose={() => setDismissedError(state)}
    />
  );
}

function ToastNotice({
  kind,
  message,
  onClose,
}: {
  kind: "success" | "error";
  message: string;
  onClose?: () => void;
}) {
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className="fixed right-4 bottom-4 left-4 z-50 rounded-2xl border border-border bg-card px-5 py-4 text-foreground shadow-[0_16px_48px_-20px_rgba(40,33,28,0.45)] sm:left-auto sm:w-[min(24rem,calc(100vw-2rem))]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-bold">
            {kind === "success" ? "Berhasil" : "Belum berhasil"}
          </p>
          <p className="mt-1 text-sm leading-6 break-words">{message}</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup notifikasi"
            className="-mr-1 flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              className="size-4"
            >
              <path d="M5 5 19 19 M19 5 5 19" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
