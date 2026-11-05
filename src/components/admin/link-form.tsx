"use client";

import { useActionState } from "react";

import { FormFeedback } from "@/components/admin/admin-toast";
import { saveLink } from "@/modules/admin/links/actions";

type LinkRecord = {
  id: string;
  branchId?: string | null;
  label: string;
  url: string;
  linkType: string;
  platform: string | null;
  iconKey: string | null;
  buttonStyle: string;
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
}: {
  link: LinkRecord | null;
  branchId?: string | null;
  hasCustomLayout?: boolean;
  stayOnPage?: boolean;
}) {
  const [state, action, pending] = useActionState(saveLink, {
    message: "",
    errors: {},
  });

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
          defaultValue={link?.linkType ?? "secondary"}
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
