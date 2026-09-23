"use client";

import { useActionState } from "react";

import { FormFeedback } from "@/components/admin/admin-toast";
import { saveBranch } from "@/modules/admin/branches/actions";

type Branch = {
  id: string;
  name: string;
  slug: string;
  whatsappNumber: string;
  ctaLabel: string | null;
  isActive: boolean;
  sortOrder: number;
};

const inputClass =
  "mt-2 min-h-11 w-full border border-border bg-background px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2";

export function BranchForm({ branch }: { branch: Branch | null }) {
  const [state, action, pending] = useActionState(saveBranch, {
    message: "",
    errors: {},
  });

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="id" value={branch?.id ?? ""} />
      <div>
        <label htmlFor="name" className="font-medium">
          Nama cabang
        </label>
        <input
          id="name"
          name="name"
          defaultValue={branch?.name ?? ""}
          className={inputClass}
          required
          maxLength={120}
        />
        <FieldError message={state.errors.name} />
      </div>
      <div>
        <label htmlFor="slug" className="font-medium">
          Slug
        </label>
        <input
          id="slug"
          name="slug"
          defaultValue={branch?.slug ?? ""}
          className={inputClass}
          required
          maxLength={120}
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          placeholder="surabaya"
        />
        <p className="mt-2 text-sm text-muted-foreground">
          Contoh alamat publik: /surabaya
        </p>
        {branch && (
          <p className="mt-2 text-sm text-muted-foreground">
            Slug menjadi URL halaman cabang. Mengubahnya akan memutus tautan
            lama yang sudah dibagikan.
          </p>
        )}
        <FieldError message={state.errors.slug} />
      </div>
      <div>
        <label htmlFor="whatsappNumber" className="font-medium">
          Nomor WhatsApp
        </label>
        <input
          id="whatsappNumber"
          name="whatsappNumber"
          type="tel"
          inputMode="numeric"
          defaultValue={branch?.whatsappNumber ?? ""}
          className={inputClass}
          required
          pattern="[1-9][0-9]{7,14}"
          placeholder="628123456789"
        />
        <p className="mt-2 text-sm text-muted-foreground">
          Gunakan kode negara dan angka saja, tanpa tanda + atau spasi.
        </p>
        <FieldError message={state.errors.whatsappNumber} />
      </div>
      <div>
        <label htmlFor="ctaLabel" className="font-medium">
          Label CTA bawaan cabang (opsional)
        </label>
        <input
          id="ctaLabel"
          name="ctaLabel"
          defaultValue={branch?.ctaLabel ?? ""}
          className={inputClass}
          maxLength={120}
        />
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Dipakai oleh produk cabang yang tidak memiliki label khusus. Kosongkan
          untuk mengikuti Pengaturan Bersama.
        </p>
        <FieldError message={state.errors.ctaLabel} />
      </div>
      <div>
        <label htmlFor="sortOrder" className="font-medium">
          Urutan di daftar cabang
        </label>
        <input
          id="sortOrder"
          name="sortOrder"
          type="number"
          min={0}
          max={2147483647}
          defaultValue={branch?.sortOrder ?? 0}
          className={inputClass}
          required
        />
        <FieldError message={state.errors.sortOrder} />
      </div>
      <label className="flex min-h-11 items-center gap-3 font-medium">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={branch?.isActive ?? true}
          className="size-5 accent-primary"
        />
        Halaman Link Bio aktif
      </label>
      <FormFeedback state={state} pending={pending} />
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 bg-primary px-5 font-medium text-primary-foreground hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
      >
        {pending
          ? "Menyimpan..."
          : branch
            ? "Simpan informasi halaman"
            : "Buat Halaman Link Bio"}
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
