"use client";

import { useState } from "react";

export function GoogleSheetsIntegrationCard({
  serviceAccountEmail,
  isConfigured,
}: {
  serviceAccountEmail: string | null;
  isConfigured: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copyEmail() {
    if (!serviceAccountEmail || !navigator.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(serviceAccountEmail);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section
      className="rounded-2xl bg-card p-6 sm:p-8"
      aria-labelledby="google-sheets-integration"
    >
      <h2
        id="google-sheets-integration"
        className="font-serif text-2xl font-bold"
      >
        Google Sheets
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Pengiriman respons Form selalu menyimpan salinan terenkripsi di Sistem
        KGJ lebih dahulu. Spreadsheet menerima salinan tambahan setelahnya.
      </p>
      {isConfigured && serviceAccountEmail ? (
        <>
          <p className="mt-5 text-sm font-semibold text-muted-foreground">
            Email akun layanan
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <code className="min-h-10 min-w-0 flex-1 overflow-x-auto rounded-lg border border-border bg-background px-3 py-2 text-sm">
              {serviceAccountEmail}
            </code>
            <button
              type="button"
              onClick={copyEmail}
              className="min-h-10 rounded-full border border-border px-4 text-sm font-bold hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {copied ? "Tersalin" : "Salin email"}
            </button>
          </div>
          <p className="mt-4 text-sm leading-6">
            Untuk setiap Spreadsheet tujuan: klik <strong>Bagikan</strong>,
            masukkan email di atas, lalu pilih peran <strong>Editor</strong>.
            Private key tidak pernah ditampilkan atau dikelola dari CMS.
          </p>
        </>
      ) : (
        <p className="mt-5 rounded-xl bg-secondary p-4 text-sm leading-6">
          Integrasi belum siap. Tambahkan kedua environment variable Google
          Sheets pada VPS: email akun layanan dan private key-nya.
        </p>
      )}
    </section>
  );
}
