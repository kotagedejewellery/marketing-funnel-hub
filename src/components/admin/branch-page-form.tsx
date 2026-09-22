"use client";

import { useActionState } from "react";

import { FormFeedback } from "@/components/admin/admin-toast";
import { saveBranchPage } from "@/modules/admin/branches/page-actions";

type Section = {
  sectionKey: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
};

const inputClass =
  "mt-2 min-h-11 w-full border border-border bg-background px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2";

export function BranchPageForm({
  branch,
  sections,
  inheritsSections,
}: {
  branch: { id: string; headline: string | null; introduction: string | null };
  sections: Section[];
  inheritsSections: boolean;
}) {
  const [state, action, pending] = useActionState(saveBranchPage, {
    message: "",
    errors: {},
    ok: false,
  });

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="branchId" value={branch.id} />
      <p className="text-sm text-muted-foreground">
        Kosongkan teks untuk memakai pengaturan halaman gabungan.
      </p>
      <div>
        <label htmlFor="branchHeadline" className="font-medium">
          Headline cabang
        </label>
        <input
          id="branchHeadline"
          name="headline"
          defaultValue={branch.headline ?? ""}
          maxLength={160}
          className={inputClass}
        />
        {state.errors.headline && (
          <p role="alert" className="mt-2 text-sm text-destructive">
            {state.errors.headline}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="branchIntroduction" className="font-medium">
          Pengantar cabang
        </label>
        <textarea
          id="branchIntroduction"
          name="introduction"
          defaultValue={branch.introduction ?? ""}
          maxLength={1000}
          rows={4}
          className={inputClass}
        />
        {state.errors.introduction && (
          <p role="alert" className="mt-2 text-sm text-destructive">
            {state.errors.introduction}
          </p>
        )}
      </div>
      <fieldset className="space-y-3 border-t border-border pt-6">
        <legend className="font-serif text-xl">Bagian halaman</legend>
        <p className="text-sm text-muted-foreground">
          {inheritsSections
            ? "Saat pertama disimpan, urutan global disalin ke cabang ini."
            : "Urutan dan visibilitas ini hanya berlaku untuk cabang ini."}
        </p>
        {sections.map((section) => (
          <div
            key={section.sectionKey}
            className="flex flex-wrap items-center justify-between gap-4 border-b border-border py-3"
          >
            <label
              htmlFor={`active_${section.sectionKey}`}
              className="flex min-h-11 items-center gap-3 font-medium"
            >
              <input
                id={`active_${section.sectionKey}`}
                type="checkbox"
                name={`active_${section.sectionKey}`}
                defaultChecked={section.isActive}
                className="size-5 accent-primary"
              />
              {section.label}
            </label>
            <label className="text-sm font-medium">
              Urutan
              <input
                type="number"
                name={`order_${section.sectionKey}`}
                defaultValue={section.sortOrder}
                min={0}
                max={2147483647}
                required
                className="ml-3 min-h-11 w-20 border border-border bg-background px-2 focus-visible:outline-2 focus-visible:outline-offset-2"
              />
            </label>
          </div>
        ))}
        {state.errors.sections && (
          <p role="alert" className="text-sm text-destructive">
            Periksa urutan bagian halaman.
          </p>
        )}
      </fieldset>
      <FormFeedback state={state} pending={pending} />
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 bg-primary px-5 font-medium text-primary-foreground hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Simpan halaman cabang"}
      </button>
    </form>
  );
}
