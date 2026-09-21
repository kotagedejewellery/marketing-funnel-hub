"use client";

import { useActionState } from "react";

import { FormFeedback } from "@/components/admin/admin-toast";
import { saveCampaign } from "@/modules/admin/campaigns/actions";
import { toWibInput } from "@/modules/admin/campaigns/validation";

type Campaign = {
  id: string;
  name: string;
  title: string | null;
  description: string | null;
  targetUrl: string | null;
  activeFrom: Date | null;
  activeUntil: Date | null;
  isActive: boolean;
  sortOrder: number;
};

const inputClass =
  "mt-2 min-h-12 w-full rounded-sm border border-border bg-background px-4 py-2 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--kgj-accent)]";

export function CampaignForm({ campaign }: { campaign: Campaign | null }) {
  const [state, action, pending] = useActionState(saveCampaign, {
    message: "",
    errors: {},
  });

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="id" value={campaign?.id ?? ""} />
      <div>
        <p className="text-sm leading-6 text-muted-foreground">
          Nama internal membantu pengelolaan; judul dan deskripsi digunakan pada
          halaman publik.
        </p>
      </div>
      <div>
        <label htmlFor="name" className="font-medium">
          Nama internal kampanye
        </label>
        <input
          id="name"
          name="name"
          defaultValue={campaign?.name ?? ""}
          className={inputClass}
          required
          maxLength={120}
        />
        <FieldError message={state.errors.name} />
      </div>
      <div>
        <label htmlFor="title" className="font-medium">
          Judul publik
        </label>
        <input
          id="title"
          name="title"
          defaultValue={campaign?.title ?? ""}
          className={inputClass}
          maxLength={160}
        />
        <FieldError message={state.errors.title} />
      </div>
      <div>
        <label htmlFor="description" className="font-medium">
          Deskripsi
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={campaign?.description ?? ""}
          className={inputClass}
          rows={4}
          maxLength={1000}
        />
        <FieldError message={state.errors.description} />
      </div>
      <div>
        <label htmlFor="targetUrl" className="font-medium">
          URL tujuan
        </label>
        <input
          id="targetUrl"
          name="targetUrl"
          type="url"
          defaultValue={campaign?.targetUrl ?? ""}
          className={inputClass}
          maxLength={2048}
          placeholder="https://..."
        />
        <FieldError message={state.errors.targetUrl} />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <label htmlFor="activeFrom" className="font-medium">
            Mulai (WIB)
          </label>
          <input
            id="activeFrom"
            name="activeFrom"
            type="datetime-local"
            defaultValue={toWibInput(campaign?.activeFrom ?? null)}
            className={inputClass}
          />
          <FieldError message={state.errors.activeFrom} />
        </div>
        <div>
          <label htmlFor="activeUntil" className="font-medium">
            Akhir (WIB)
          </label>
          <input
            id="activeUntil"
            name="activeUntil"
            type="datetime-local"
            defaultValue={toWibInput(campaign?.activeUntil ?? null)}
            className={inputClass}
          />
          <FieldError message={state.errors.activeUntil} />
        </div>
      </div>
      <div>
        <label htmlFor="sortOrder" className="font-medium">
          Urutan prioritas
        </label>
        <input
          id="sortOrder"
          name="sortOrder"
          type="number"
          min={0}
          max={2147483647}
          defaultValue={campaign?.sortOrder ?? 0}
          className={inputClass}
          required
        />
        <p className="mt-2 text-sm text-muted-foreground">
          Angka lebih kecil tampil lebih dahulu jika beberapa kampanye memenuhi
          jadwal.
        </p>
        <FieldError message={state.errors.sortOrder} />
      </div>
      <label className="flex min-h-11 items-center gap-3 border-t border-border pt-6 font-medium">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={campaign?.isActive ?? true}
          className="size-5 accent-primary"
        />
        Aktif
      </label>
      <FormFeedback state={state} pending={pending} />
      <button
        type="submit"
        disabled={pending}
        className="min-h-12 cursor-pointer bg-primary px-6 font-semibold text-primary-foreground hover:bg-[var(--kgj-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Simpan kampanye"}
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
