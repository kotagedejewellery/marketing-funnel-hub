"use client";

import { useState } from "react";

export function BranchPublicUrl({
  url,
  isActive,
}: {
  url: string;
  isActive: boolean;
}) {
  const [copyStatus, setCopyStatus] = useState("");

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(url);
      setCopyStatus("URL berhasil disalin.");
    } catch {
      setCopyStatus(
        "URL gagal disalin. Salin alamat yang tertera secara manual.",
      );
    }
  }

  return (
    <div className="mt-2">
      <p className="break-all text-sm text-muted-foreground">{url}</p>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
        {isActive ? (
          <>
            <button
              type="button"
              onClick={copyUrl}
              className="min-h-11 font-semibold text-[var(--kgj-accent)] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Salin URL
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Lihat halaman
            </a>
          </>
        ) : (
          <span className="text-muted-foreground">
            Aktifkan cabang sebelum membagikan URL ini.
          </span>
        )}
      </div>
      <p role="status" className="text-sm" aria-live="polite">
        {copyStatus}
      </p>
    </div>
  );
}
