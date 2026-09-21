"use client";

import { useState } from "react";

import {
  consentChangedEventName,
  consentCookieName,
  consentMaxAgeSeconds,
  encodeConsentCookie,
  type ConsentChoice,
} from "@/modules/tracking/consent";

export function ConsentControl({
  initialChoice,
}: {
  initialChoice: ConsentChoice | null;
}) {
  const [choice, setChoice] = useState(initialChoice);
  const [editing, setEditing] = useState(false);
  const [analytics, setAnalytics] = useState(initialChoice?.analytics ?? false);
  const [marketing, setMarketing] = useState(initialChoice?.marketing ?? false);
  const [saveError, setSaveError] = useState(false);

  function save(next: ConsentChoice) {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    const value = encodeConsentCookie(next);
    document.cookie = `${consentCookieName}=${value}; Max-Age=${consentMaxAgeSeconds}; Path=/; SameSite=Lax${secure}`;
    const persisted = document.cookie
      .split(";")
      .some((entry) => entry.trim() === `${consentCookieName}=${value}`);
    if (!persisted) {
      setSaveError(true);
      setEditing(true);
      return;
    }
    setSaveError(false);
    setChoice(next);
    setAnalytics(next.analytics);
    setMarketing(next.marketing);
    setEditing(false);
    if (
      (choice?.analytics && !next.analytics) ||
      (choice?.marketing && !next.marketing)
    ) {
      // A reload removes provider scripts already loaded under earlier consent.
      window.location.reload();
      return;
    }
    window.dispatchEvent(new Event(consentChangedEventName));
  }

  return (
    <section
      aria-label="Preferensi privasi"
      className="mb-4 rounded-2xl bg-card px-5 py-4 text-sm sm:px-6"
    >
      {editing ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            save({ analytics, marketing });
          }}
          className="space-y-4"
        >
          <div>
            <h2 className="font-serif text-lg font-bold">
              Preferensi pelacakan
            </h2>
            <p className="mt-1 max-w-xl leading-6 text-muted-foreground">
              Pilih apakah KGJ boleh mengukur kunjungan dan efektivitas iklan.
              Anda tetap dapat membuka WhatsApp tanpa memberi izin.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-start gap-3 rounded-xl bg-background p-4">
              <input
                type="checkbox"
                checked={analytics}
                onChange={(event) => setAnalytics(event.target.checked)}
                className="mt-0.5 size-5 shrink-0 accent-primary"
              />
              <span>
                <strong className="block">Analitik</strong>
                <span className="mt-1 block text-muted-foreground">
                  Pengukuran kunjungan dan minat produk.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-xl bg-background p-4">
              <input
                type="checkbox"
                checked={marketing}
                onChange={(event) => setMarketing(event.target.checked)}
                className="mt-0.5 size-5 shrink-0 accent-primary"
              />
              <span>
                <strong className="block">Pemasaran</strong>
                <span className="mt-1 block text-muted-foreground">
                  Pengukuran efektivitas iklan.
                </span>
              </span>
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => save({ analytics: false, marketing: false })}
              className="min-h-11 rounded-full border border-border px-5 font-semibold hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Tolak pelacakan
            </button>
            <button
              type="submit"
              className="min-h-11 rounded-full border border-border px-5 font-semibold hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Simpan pilihan
            </button>
            <button
              type="button"
              onClick={() => save({ analytics: true, marketing: true })}
              className="min-h-11 rounded-full bg-primary px-5 font-semibold text-primary-foreground hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Izinkan semua
            </button>
          </div>
          {saveError && (
            <p role="alert" className="text-destructive">
              Pilihan tidak dapat disimpan di browser ini. Periksa pengaturan
              cookie situs lalu coba lagi.
            </p>
          )}
        </form>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {choice ? (
            <p role="status" className="text-muted-foreground">
              Pilihan pelacakan tersimpan: analitik{" "}
              {choice.analytics ? "aktif" : "nonaktif"}, pemasaran{" "}
              {choice.marketing ? "aktif" : "nonaktif"}.
            </p>
          ) : (
            <p className="max-w-xl leading-6 text-muted-foreground">
              Pilih apakah KGJ boleh mengukur kunjungan dan efektivitas iklan.
              Anda tetap dapat membuka WhatsApp tanpa memberi izin.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {!choice && (
              <button
                type="button"
                onClick={() => save({ analytics: false, marketing: false })}
                className="min-h-11 rounded-full px-4 font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Tolak pelacakan
              </button>
            )}
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="min-h-11 rounded-full bg-secondary px-4 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {choice ? "Ubah preferensi privasi" : "Atur preferensi"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
