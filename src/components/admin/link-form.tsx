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
  isActive: boolean;
  sortOrder: number;
};

const inputClass =
  "mt-2 min-h-12 w-full rounded-sm border border-border bg-background px-4 py-2 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--kgj-accent)]";

export function LinkForm({
  link,
  branchId = null,
  stayOnPage = false,
}: {
  link: LinkRecord | null;
  branchId?: string | null;
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
      <input type="hidden" name="iconKey" value={link?.iconKey ?? ""} />
      <div>
        <p className="text-sm leading-6 text-muted-foreground">
          Tentukan label, tujuan, dan posisi tautan pada halaman publik.
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
        </select>
        <FieldError message={state.errors.linkType} />
      </div>
      <div>
        <label htmlFor="sortOrder" className="font-medium">
          Urutan tampil
        </label>
        <input
          id="sortOrder"
          name="sortOrder"
          type="number"
          min={0}
          max={2147483647}
          defaultValue={link?.sortOrder ?? 0}
          className={inputClass}
          required
        />
        <FieldError message={state.errors.sortOrder} />
      </div>
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
