"use client";

import { useActionState, useState } from "react";

import { FormFeedback } from "@/components/admin/admin-toast";
import { saveLink } from "@/modules/admin/links/actions";
import {
  metaCtaEventNames,
  parseMetaCtaEventName,
} from "@/modules/tracking/meta-event";

type LinkRecord = {
  id: string;
  branchId?: string | null;
  label: string;
  url: string;
  linkType: string;
  platform: string | null;
  iconKey: string | null;
  buttonStyle: string;
  metaEventName: string | null;
  isActive: boolean;
  sortOrder: number;
};

const inputClass =
  "mt-2 min-h-12 w-full rounded-sm border border-border bg-background px-4 py-2 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--kgj-accent)]";

export function LinkForm({
  link,
  branchId = null,
  hasCustomLayout = false,
  stayOnPage = false,
  canManageMeta = false,
}: {
  link: LinkRecord | null;
  branchId?: string | null;
  hasCustomLayout?: boolean;
  stayOnPage?: boolean;
  canManageMeta?: boolean;
}) {
  const [state, action, pending] = useActionState(saveLink, {
    message: "",
    errors: {},
  });
  const [linkType, setLinkType] = useState(link?.linkType ?? "secondary");
  const legacyMetaEventName =
    link?.metaEventName && !parseMetaCtaEventName(link.metaEventName)
      ? link.metaEventName
      : null;
  const [metaEventSelection, setMetaEventSelection] = useState(
    legacyMetaEventName ? "__legacy__" : (link?.metaEventName ?? ""),
  );

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="id" value={link?.id ?? ""} />
      {stayOnPage && <input type="hidden" name="stayOnPage" value="1" />}
      <input
        type="hidden"
        name="branchId"
        value={link?.branchId ?? branchId ?? ""}
      />
      <input type="hidden" name="platform" value={link?.platform ?? ""} />
      <input type="hidden" name="sortOrder" value={link?.sortOrder ?? 0} />
      <div>
        <p className="text-sm leading-6 text-muted-foreground">
          Tentukan label, tujuan, dan jenis tautan. Posisi diatur dari daftar
          setelah tautan disimpan.
        </p>
      </div>
      <div>
        <label htmlFor="label" className="font-medium">
          Label tautan
        </label>
        <input
          id="label"
          name="label"
          defaultValue={link?.label ?? ""}
          className={inputClass}
          required
          maxLength={120}
        />
        <FieldError message={state.errors.label} />
      </div>
      <div>
        <label htmlFor="url" className="font-medium">
          URL tujuan
        </label>
        <input
          id="url"
          name="url"
          type="url"
          defaultValue={link?.url ?? ""}
          className={inputClass}
          required
          maxLength={2048}
          placeholder="https://..."
        />
        <FieldError message={state.errors.url} />
      </div>
      <div>
        <label htmlFor="linkType" className="font-medium">
          Jenis tautan
        </label>
        <select
          id="linkType"
          name="linkType"
          value={linkType}
          onChange={(event) => setLinkType(event.target.value)}
          className={inputClass}
        >
          <option value="secondary">Tautan tambahan</option>
          <option value="social">Sosial</option>
          <option value="cta">Tombol custom</option>
        </select>
        <FieldError message={state.errors.linkType} />
      </div>
      <div>
        <label htmlFor="buttonStyle" className="font-medium">
          Gaya tombol custom
        </label>
        <select
          id="buttonStyle"
          name="buttonStyle"
          defaultValue={link?.buttonStyle ?? "primary"}
          className={inputClass}
        >
          <option value="primary">Utama gelap</option>
          <option value="soft">Lembut</option>
          <option value="outline">Outline</option>
        </select>
        <p className="mt-2 text-sm text-muted-foreground">
          Gaya ini digunakan saat jenis tautan adalah Tombol custom.
        </p>
        <FieldError message={state.errors.buttonStyle} />
      </div>
      <div>
        <label htmlFor="iconKey" className="font-medium">
          Ikon tombol custom
        </label>
        <select
          id="iconKey"
          name="iconKey"
          defaultValue={link?.iconKey ?? ""}
          className={inputClass}
        >
          <option value="">Tanpa ikon</option>
          <option value="arrow">Panah</option>
          <option value="catalog">Katalog</option>
          <option value="calendar">Kalender</option>
        </select>
        <FieldError message={state.errors.iconKey} />
      </div>
      {canManageMeta && linkType === "cta" && (
        <div className="border-t border-border pt-6">
          <label htmlFor="metaEventName" className="font-medium">
            Event Meta khusus
          </label>
          <select
            id="metaEventName"
            name={
              metaEventSelection === "__legacy__" ? undefined : "metaEventName"
            }
            value={metaEventSelection}
            onChange={(event) => setMetaEventSelection(event.target.value)}
            className={inputClass}
          >
            {legacyMetaEventName && (
              <option value="__legacy__">
                Pertahankan event custom lama: {legacyMetaEventName}
              </option>
            )}
            <option value="">Ikuti event LinkClick bawaan</option>
            {metaCtaEventNames.map((eventName) => (
              <option key={eventName} value={eventName}>
                {eventName}
              </option>
            ))}
          </select>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Berlaku hanya untuk Tombol custom. Pilih event standar untuk
            mengganti event custom lama atau mengikuti LinkClick bawaan.
          </p>
          <FieldError message={state.errors.metaEventName} />
        </div>
      )}
      {hasCustomLayout && !link && (
        <div>
          <label htmlFor="layoutPlacement" className="font-medium">
            Posisi awal di halaman
          </label>
          <select
            id="layoutPlacement"
            name="layoutPlacement"
            defaultValue="end"
            className={inputClass}
          >
            <option value="end">Paling bawah</option>
            <option value="start">Paling atas</option>
          </select>
          <p className="mt-2 text-sm text-muted-foreground">
            Setelah disimpan, posisi tetap dapat diatur dari Susunan halaman.
          </p>
        </div>
      )}
      <label className="flex min-h-11 items-center gap-3 border-t border-border pt-6 font-medium">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={link?.isActive ?? true}
          className="size-5 accent-primary"
        />
        Aktif
      </label>
      <FormFeedback state={state} pending={pending} />
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending || undefined}
        className="min-h-12 cursor-pointer bg-primary px-6 font-semibold text-primary-foreground hover:bg-[var(--kgj-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Simpan tautan"}
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
