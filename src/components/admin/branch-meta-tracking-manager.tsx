"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { FormFeedback } from "@/components/admin/admin-toast";
import { DestructiveConfirmDialog } from "@/components/admin/destructive-confirm-dialog";
import {
  saveBranchMetaTrackingConfig,
  type BranchMetaTrackingActionState,
} from "@/modules/admin/tracking/branch-meta-actions";
import { metaCtaEventNames } from "@/modules/tracking/meta-event";

type Settings = {
  mode: "inherit" | "custom" | "disabled";
  pixelId: string | null;
  capiTokenConfigured: boolean;
  testEventCodeConfigured: boolean;
  capiAccessToken: string | null;
  capiTestEventCode: string | null;
  whatsappCtaMetaEvent: (typeof metaCtaEventNames)[number];
  globalConfigured: boolean;
  customCapiReady: boolean;
};

const inputClass =
  "mt-2 min-h-11 w-full rounded-sm border border-border bg-background px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2";

function modeSummary(settings: Settings, canManage: boolean) {
  if (settings.mode === "disabled")
    return "Meta dinonaktifkan untuk cabang ini.";
  if (settings.mode === "custom") {
    if (canManage && !settings.customCapiReady)
      return "Konfigurasi khusus tersimpan, tetapi CAPI belum siap. Periksa kunci enkripsi server dan token CAPI.";
    return "Menggunakan Pixel dan CAPI khusus cabang.";
  }
  if (canManage && !settings.globalConfigured)
    return "Konfigurasi Meta global belum lengkap. Lengkapi Pixel ID dan token CAPI di environment server, atau gunakan konfigurasi khusus cabang.";
  return "Mengikuti konfigurasi Meta global dari environment server.";
}

export function BranchMetaTrackingManager({
  branchId,
  settings,
  canManage,
}: {
  branchId: string;
  settings: Settings;
  canManage: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState(settings.mode);
  const [whatsappCtaMetaEvent, setWhatsappCtaMetaEvent] = useState(
    settings.whatsappCtaMetaEvent,
  );
  const [confirmRemoval, setConfirmRemoval] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const confirmationRef = useRef<HTMLInputElement>(null);
  const testEventCodeRef = useRef<HTMLInputElement>(null);
  const confirmedRemoval = useRef(false);
  const [state, action, pending] = useActionState<
    BranchMetaTrackingActionState,
    FormData
  >(saveBranchMetaTrackingConfig, { message: "", errors: {} });

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [router, state.ok]);

  useEffect(() => {
    if (!state.message) return;
    confirmedRemoval.current = false;
    if (confirmationRef.current) confirmationRef.current.value = "false";
  }, [state]);

  return (
    <section className="rounded-2xl bg-card p-6 sm:p-8">
      <h2 className="font-serif text-2xl">Meta Pixel &amp; CAPI</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {modeSummary({ ...settings, mode }, canManage)} Saat halaman dibuka,
        Meta selalu menerima PageView. Admin dapat memilih event Meta khusus
        untuk klik CTA WhatsApp; analytics internal tetap Contact dan tautan
        biasa tetap LinkClick.
      </p>
      {!canManage ? (
        <p className="mt-4 text-sm font-medium text-muted-foreground">
          Hanya technical admin yang dapat mengubah kredensial Meta.
        </p>
      ) : (
        <form
          ref={formRef}
          action={action}
          className="mt-6 space-y-5"
          onSubmit={(event) => {
            const removesCustomConfig =
              settings.mode === "custom" && mode !== "custom";
            if (removesCustomConfig && !confirmedRemoval.current) {
              event.preventDefault();
              setConfirmRemoval(true);
            }
          }}
        >
          <input type="hidden" name="branchId" value={branchId} />
          <input
            ref={confirmationRef}
            type="hidden"
            name="confirmCustomConfigRemoval"
            defaultValue="false"
          />
          <div>
            <label htmlFor="meta-mode" className="font-medium">
              Sumber konfigurasi
            </label>
            <select
              id="meta-mode"
              name="mode"
              value={mode}
              onChange={(event) => {
                confirmedRemoval.current = false;
                if (confirmationRef.current)
                  confirmationRef.current.value = "false";
                setMode(event.target.value as Settings["mode"]);
              }}
              className={inputClass}
            >
              <option value="inherit">Ikuti konfigurasi global</option>
              <option value="custom">Gunakan konfigurasi khusus cabang</option>
              <option value="disabled">
                Nonaktifkan Meta untuk cabang ini
              </option>
            </select>
          </div>

          {mode === "custom" && (
            <>
              <div>
                <label htmlFor="meta-pixel-id" className="font-medium">
                  Meta Pixel ID
                </label>
                <input
                  id="meta-pixel-id"
                  name="pixelId"
                  inputMode="numeric"
                  defaultValue={settings.pixelId ?? ""}
                  className={inputClass}
                  required
                />
                <FieldError message={state.errors.pixelId} />
              </div>
              <div>
                <label htmlFor="meta-capi-token" className="font-medium">
                  CAPI access token
                </label>
                <input
                  id="meta-capi-token"
                  name="capiAccessToken"
                  type="text"
                  autoComplete="off"
                  defaultValue={settings.capiAccessToken ?? ""}
                  className={inputClass}
                  required={!settings.capiTokenConfigured}
                  placeholder="Masukkan token CAPI"
                />
                <p className="mt-2 text-sm text-muted-foreground">
                  Nilai tetap terenkripsi saat disimpan. Sesuai pengaturan
                  keamanan yang disetujui, nilainya hanya ditampilkan kepada
                  technical admin.
                </p>
                <FieldError message={state.errors.capiAccessToken} />
              </div>
            </>
          )}
          {mode !== "disabled" && (
            <div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Saat Link Bio dibuka, Meta menerima PageView. Analytics internal
                juga tercatat sebagai PageView.
              </p>
            </div>
          )}
          {mode !== "disabled" && (
            <div>
              <label htmlFor="meta-whatsapp-cta-event" className="font-medium">
                Event Meta saat CTA WhatsApp diklik
              </label>
              <select
                id="meta-whatsapp-cta-event"
                name="whatsappCtaMetaEvent"
                value={whatsappCtaMetaEvent}
                onChange={(event) =>
                  setWhatsappCtaMetaEvent(
                    event.target.value as (typeof metaCtaEventNames)[number],
                  )
                }
                className={inputClass}
              >
                {metaCtaEventNames.map((eventName) => (
                  <option key={eventName} value={eventName}>
                    {eventName}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Pilihan ini hanya dikirim ke Meta saat CTA WhatsApp diklik.
                Analytics internal tetap mencatat Contact dan tautan biasa tetap
                LinkClick.
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Pilih event yang benar-benar terjadi saat klik CTA. Jangan pilih
                Purchase atau AddPaymentInfo bila pembayaran belum terjadi.
              </p>
              <FieldError message={state.errors.whatsappCtaMetaEvent} />
            </div>
          )}
          {mode !== "disabled" && (
            <div>
              <label htmlFor="meta-test-event-code" className="font-medium">
                Test Event Code CAPI (opsional)
              </label>
              <input
                id="meta-test-event-code"
                name="capiTestEventCode"
                ref={testEventCodeRef}
                type="text"
                autoComplete="off"
                defaultValue={settings.capiTestEventCode ?? ""}
                className={inputClass}
                placeholder="Masukkan kode dari Meta Events Manager"
              />
              <p className="mt-2 text-sm text-muted-foreground">
                Hanya dikirim server ke CAPI sebagai test_event_code; tidak
                dikirim ke Pixel atau halaman publik. Nilai hanya terlihat untuk
                technical admin.
              </p>
              {settings.testEventCodeConfigured ? (
                <label className="mt-3 flex items-center gap-2 text-sm font-medium">
                  <input
                    name="clearCapiTestEventCode"
                    type="checkbox"
                    value="true"
                    className="size-4 accent-primary"
                    onChange={(event) => {
                      if (event.target.checked && testEventCodeRef.current)
                        testEventCodeRef.current.value = "";
                    }}
                  />
                  Hapus Test Event Code tersimpan
                </label>
              ) : null}
              <FieldError message={state.errors.capiTestEventCode} />
            </div>
          )}

          <FormFeedback state={state} pending={pending} />
          <FieldError message={state.errors.mode} />
          <button
            type="submit"
            disabled={pending}
            aria-busy={pending || undefined}
            className="min-h-11 bg-primary px-5 font-medium text-primary-foreground hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
          >
            {pending ? "Menyimpan..." : "Simpan pengaturan Meta"}
          </button>
        </form>
      )}
      <DestructiveConfirmDialog
        open={confirmRemoval && !state.ok}
        count={1}
        pending={pending}
        title="Hapus konfigurasi Meta khusus?"
        description="Pixel ID dan token CAPI khusus cabang akan dihapus permanen. Anda harus memasukkan token baru jika ingin memakai konfigurasi khusus lagi."
        confirmLabel="Hapus konfigurasi khusus"
        pendingLabel="Menyimpan..."
        onClose={() => setConfirmRemoval(false)}
        onConfirm={() => {
          confirmedRemoval.current = true;
          if (confirmationRef.current) confirmationRef.current.value = "true";
          setConfirmRemoval(false);
          formRef.current?.requestSubmit();
        }}
      />
    </section>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="mt-2 text-sm text-destructive">
      {message}
    </p>
  ) : null;
}
