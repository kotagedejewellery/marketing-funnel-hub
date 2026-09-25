"use client";

import { useActionState } from "react";

import { FormFeedback } from "@/components/admin/admin-toast";
import { saveSiteSettings } from "@/modules/admin/content/actions";

type Settings = {
  siteName: string;
  headline: string | null;
  introduction: string | null;
  privacyUrl: string | null;
  defaultWhatsappMessage: string;
  defaultCtaLabel: string;
};

const inputClass =
  "mt-2 min-h-12 w-full rounded-sm border border-border bg-background px-4 py-2 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--kgj-accent)]";

export function SiteSettingsForm({ settings }: { settings: Settings }) {
  const [state, action, pending] = useActionState(saveSiteSettings, {
    message: "",
    errors: {},
    ok: false,
  });

  return (
    <form action={action} className="space-y-6">
      <p className="text-sm leading-6 text-muted-foreground">
        Nilai ini menjadi standar KGJ bagi cabang yang belum membuat pengaturan
        khusus.
      </p>
      <div className="mt-7 grid gap-6 lg:grid-cols-2">
        <div>
          <label htmlFor="siteName" className="font-medium">
            Nama merek
          </label>
          <input
            id="siteName"
            name="siteName"
            defaultValue={settings.siteName}
            className={inputClass}
            required
            maxLength={120}
          />
          <FieldError message={state.errors.siteName} />
        </div>
        <div>
          <label htmlFor="headline" className="font-medium">
            Headline standar
          </label>
          <input
            id="headline"
            name="headline"
            defaultValue={settings.headline ?? ""}
            className={inputClass}
            maxLength={160}
          />
          <FieldError message={state.errors.headline} />
        </div>
      </div>
      <div className="mt-6 space-y-6">
        <div>
          <label htmlFor="introduction" className="font-medium">
            Deskripsi standar
          </label>
          <textarea
            id="introduction"
            name="introduction"
            defaultValue={settings.introduction ?? ""}
            className={inputClass}
            rows={4}
            maxLength={1000}
          />
          <FieldError message={state.errors.introduction} />
        </div>
        <div>
          <label htmlFor="privacyUrl" className="font-medium">
            URL kebijakan privasi KGJ
          </label>
          <input
            id="privacyUrl"
            name="privacyUrl"
            type="url"
            defaultValue={settings.privacyUrl ?? ""}
            className={inputClass}
            maxLength={2048}
            placeholder="https://..."
          />
          <FieldError message={state.errors.privacyUrl} />
        </div>
      </div>
      <div className="mt-8 border-t border-border pt-8">
        <h3 className="font-serif text-2xl">Standar WhatsApp</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Digunakan ketika produk atau cabang belum memiliki pengaturan khusus.
        </p>
      </div>
      <div className="mt-6 space-y-6">
        <div>
          <label htmlFor="defaultWhatsappMessage" className="font-medium">
            Pesan WhatsApp standar
          </label>
          <textarea
            id="defaultWhatsappMessage"
            name="defaultWhatsappMessage"
            defaultValue={settings.defaultWhatsappMessage}
            className={inputClass}
            rows={3}
            maxLength={500}
            required
          />
          <p className="mt-2 text-sm text-muted-foreground">
            Variabel: {"{product}"} dan {"{branch}"}.
          </p>
          <FieldError message={state.errors.defaultWhatsappMessage} />
        </div>
        <div>
          <label htmlFor="defaultCtaLabel" className="font-medium">
            Label CTA standar
          </label>
          <input
            id="defaultCtaLabel"
            name="defaultCtaLabel"
            defaultValue={settings.defaultCtaLabel}
            className={inputClass}
            maxLength={80}
            required
          />
          <FieldError message={state.errors.defaultCtaLabel} />
        </div>
      </div>
      <FormFeedback state={state} pending={pending} />
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending || undefined}
        className="mt-6 min-h-12 cursor-pointer bg-primary px-6 font-semibold text-primary-foreground hover:bg-[var(--kgj-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Simpan standar KGJ"}
      </button>
    </form>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="mt-2 text-sm text-destructive">
      {message}
    </p>
  ) : null;
}
