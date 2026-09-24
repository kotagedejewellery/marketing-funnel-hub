"use client";

import { useActionState, useState } from "react";

import { FormFeedback } from "@/components/admin/admin-toast";
import { saveBranchPage } from "@/modules/admin/branches/page-actions";

type Section = {
  sectionKey: string;
  label: string;
  publicTitle: string | null;
  sortOrder: number;
  isActive: boolean;
};

const sectionSupportsPublicTitle = (sectionKey: string) =>
  !["profile_logo", "brand_header", "campaign_banner", "footer"].includes(
    sectionKey,
  );

const inputClass =
  "mt-2 min-h-11 w-full border border-border bg-background px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2";

export function BranchPageForm({
  branch,
  sections,
  inheritsSections,
  mode,
}: {
  branch: { id: string; headline: string | null; introduction: string | null };
  sections: Section[];
  inheritsSections: boolean;
  mode: "identity" | "sections";
}) {
  const [orderedSections, setOrderedSections] = useState(sections);
  const [state, action, pending] = useActionState(saveBranchPage, {
    message: "",
    errors: {},
    ok: false,
  });

  function moveSection(index: number, direction: -1 | 1) {
    const other = index + direction;
    if (other < 0 || other >= orderedSections.length) return;
    if (
      orderedSections[index].sectionKey === "profile_logo" ||
      orderedSections[other].sectionKey === "profile_logo"
    )
      return;
    setOrderedSections((current) => {
      const next = [...current];
      [next[index], next[other]] = [next[other], next[index]];
      return next;
    });
  }

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="branchId" value={branch.id} />
      <input type="hidden" name="mode" value={mode} />
      {mode === "identity" ? (
        <p className="text-sm text-muted-foreground">
          Isi nilai untuk menjadikannya khusus cabang. Kosongkan judul atau
          deskripsi agar tetap mengikuti Standar &amp; Template KGJ.
        </p>
      ) : null}
      {mode === "identity" ? (
        <div>
          <label htmlFor="branchHeadline" className="font-medium">
            Judul profil
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
      ) : (
        <input type="hidden" name="headline" value={branch.headline ?? ""} />
      )}
      {mode === "identity" ? (
        <div>
          <label htmlFor="branchIntroduction" className="font-medium">
            Deskripsi singkat
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
      ) : (
        <input
          type="hidden"
          name="introduction"
          value={branch.introduction ?? ""}
        />
      )}
      {mode === "sections" ? (
        <fieldset className="space-y-3">
          <legend className="font-serif text-xl">Susunan section</legend>
          <p className="text-sm text-muted-foreground">
            {inheritsSections
              ? "Simpan untuk menyalin template KGJ, lalu atur susunan ini khusus untuk cabang."
              : "Urutan dan visibilitas ini hanya berlaku untuk cabang ini."}
          </p>
          {orderedSections.map((section, index) => (
            <div
              key={section.sectionKey}
              className="flex flex-wrap items-center justify-between gap-4 border-b border-border py-3"
            >
              <input
                type="hidden"
                name={`order_${section.sectionKey}`}
                value={index * 10}
              />
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
              {sectionSupportsPublicTitle(section.sectionKey) ? (
                <label className="w-full text-sm font-medium sm:max-w-xs">
                  Judul publik (opsional)
                  <input
                    name={`title_${section.sectionKey}`}
                    defaultValue={section.publicTitle ?? ""}
                    maxLength={160}
                    className={inputClass}
                  />
                </label>
              ) : (
                <input
                  type="hidden"
                  name={`title_${section.sectionKey}`}
                  value=""
                />
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={
                    section.sectionKey === "profile_logo" ||
                    index === 0 ||
                    orderedSections[index - 1]?.sectionKey === "profile_logo"
                  }
                  onClick={() => moveSection(index, -1)}
                  className="min-h-11 rounded-full border border-border px-3 text-sm disabled:opacity-40"
                >
                  Naik
                </button>
                <button
                  type="button"
                  disabled={
                    section.sectionKey === "profile_logo" ||
                    index === orderedSections.length - 1 ||
                    orderedSections[index + 1]?.sectionKey === "profile_logo"
                  }
                  onClick={() => moveSection(index, 1)}
                  className="min-h-11 rounded-full border border-border px-3 text-sm disabled:opacity-40"
                >
                  Turun
                </button>
              </div>
            </div>
          ))}
          {state.errors.sections && (
            <p role="alert" className="text-sm text-destructive">
              Periksa urutan bagian halaman.
            </p>
          )}
        </fieldset>
      ) : (
        sections.map((section) => (
          <div key={section.sectionKey}>
            <input
              type="hidden"
              name={`order_${section.sectionKey}`}
              value={section.sortOrder}
            />
            <input
              type="hidden"
              name={`title_${section.sectionKey}`}
              value={section.publicTitle ?? ""}
            />
            {section.isActive && (
              <input
                type="hidden"
                name={`active_${section.sectionKey}`}
                value="on"
              />
            )}
          </div>
        ))
      )}
      <FormFeedback state={state} pending={pending} />
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 bg-primary px-5 font-medium text-primary-foreground hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
      >
        {pending
          ? "Menyimpan..."
          : mode === "identity"
            ? "Simpan profil cabang"
            : "Simpan susunan section"}
      </button>
    </form>
  );
}
