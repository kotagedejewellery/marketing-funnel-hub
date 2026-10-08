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

type VisibilityOverride = "inherit" | "show" | "hide";

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
  branch: {
    id: string;
    profileName: string | null;
    headline: string | null;
    introduction: string | null;
    showProfileName: boolean | null;
    showHeadline: boolean | null;
    showIntroduction: boolean | null;
  };
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
          Nilai kosong mengikuti Standar &amp; Template KGJ. Pilih sembunyikan
          untuk tidak menampilkan elemen tersebut pada halaman publik.
        </p>
      ) : null}
      {mode === "identity" ? (
        <fieldset className="space-y-6">
          <legend className="font-serif text-xl">Tampilan publik</legend>
          <div>
            <label htmlFor="branchProfileName" className="font-medium">
              Nama tampilan Link Bio (opsional)
            </label>
            <input
              id="branchProfileName"
              name="profileName"
              defaultValue={branch.profileName ?? ""}
              maxLength={160}
              className={inputClass}
            />
            <p className="mt-2 text-sm text-muted-foreground">
              Kosongkan untuk memakai nama merek dan cabang secara otomatis.
            </p>
            <FieldError message={state.errors.profileName} />
            <VisibilitySelect
              id="branchProfileNameVisibility"
              name="profileNameVisibility"
              label="Tampilkan nama Link Bio"
              value={visibilityValue(branch.showProfileName)}
            />
          </div>
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
            <FieldError message={state.errors.headline} />
            <VisibilitySelect
              id="branchHeadlineVisibility"
              name="headlineVisibility"
              label="Tampilkan judul profil"
              value={visibilityValue(branch.showHeadline)}
            />
          </div>
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
            <FieldError message={state.errors.introduction} />
            <VisibilitySelect
              id="branchIntroductionVisibility"
              name="introductionVisibility"
              label="Tampilkan deskripsi singkat"
              value={visibilityValue(branch.showIntroduction)}
            />
          </div>
        </fieldset>
      ) : (
        <>
          <input
            type="hidden"
            name="profileName"
            value={branch.profileName ?? ""}
          />
          <input type="hidden" name="headline" value={branch.headline ?? ""} />
          <input
            type="hidden"
            name="introduction"
            value={branch.introduction ?? ""}
          />
          <input
            type="hidden"
            name="profileNameVisibility"
            value={visibilityValue(branch.showProfileName)}
          />
          <input
            type="hidden"
            name="headlineVisibility"
            value={visibilityValue(branch.showHeadline)}
          />
          <input
            type="hidden"
            name="introductionVisibility"
            value={visibilityValue(branch.showIntroduction)}
          />
        </>
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
        aria-busy={pending || undefined}
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

function visibilityValue(value: boolean | null): VisibilityOverride {
  return value === null ? "inherit" : value ? "show" : "hide";
}

function VisibilitySelect({
  id,
  label,
  name,
  value,
}: {
  id: string;
  label: string;
  name: string;
  value: VisibilityOverride;
}) {
  return (
    <label htmlFor={id} className="mt-4 block text-sm font-medium">
      {label}
      <select id={id} name={name} defaultValue={value} className={inputClass}>
        <option value="inherit">Ikuti template KGJ</option>
        <option value="show">Tampilkan</option>
        <option value="hide">Sembunyikan</option>
      </select>
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="mt-2 text-sm text-destructive">
      {message}
    </p>
  ) : null;
}
