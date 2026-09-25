"use client";

import { useActionState, type ReactNode } from "react";

import { FormFeedback } from "@/components/admin/admin-toast";
import { changeContentSection } from "@/modules/admin/content/actions";

type Section = {
  id: string;
  sectionKey: string;
  label: string;
  publicTitle: string | null;
  isActive: boolean;
};

const sectionSupportsPublicTitle = (sectionKey: string) =>
  !["profile_logo", "brand_header", "campaign_banner", "footer"].includes(
    sectionKey,
  );

export function SectionList({ sections }: { sections: Section[] }) {
  const [state, action, pending] = useActionState(changeContentSection, {
    message: "",
    errors: {},
    ok: false,
  });

  return (
    <section
      className="mt-10 border border-border bg-card"
      aria-labelledby="section-order-heading"
    >
      <div className="border-b border-border px-5 py-5 sm:px-6">
        <h2 id="section-order-heading" className="font-serif text-2xl">
          Template susunan section
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Dipakai cabang hingga cabang menyimpan susunan sectionnya sendiri.
        </p>
      </div>
      <FormFeedback state={state} pending={pending} />
      {sections.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted-foreground sm:px-6">
          Belum ada bagian yang dapat diatur.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {sections.map((section, index) => (
            <li
              key={section.id}
              className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-6"
            >
              <div className="flex min-w-0 items-center gap-4">
                <span
                  aria-hidden="true"
                  className="w-7 shrink-0 text-sm tabular-nums text-muted-foreground"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="font-semibold">{section.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {section.isActive ? "Tampil" : "Disembunyikan"}
                  </p>
                </div>
              </div>
              <form action={action} className="flex flex-wrap gap-2">
                <input type="hidden" name="id" value={section.id} />
                {sectionSupportsPublicTitle(section.sectionKey) && (
                  <label className="flex min-h-11 items-center gap-2 text-sm">
                    <span className="sr-only">
                      Judul publik {section.label}
                    </span>
                    <input
                      name="publicTitle"
                      defaultValue={section.publicTitle ?? ""}
                      maxLength={160}
                      placeholder="Judul publik (opsional)"
                      className="min-h-11 min-w-48 border border-border bg-background px-3"
                    />
                    <ActionButton
                      operation="title"
                      disabled={pending}
                      pending={pending}
                    >
                      Simpan judul
                    </ActionButton>
                  </label>
                )}
                <ActionButton
                  operation="up"
                  pending={pending}
                  disabled={
                    pending ||
                    section.sectionKey === "profile_logo" ||
                    index === 0 ||
                    sections[index - 1]?.sectionKey === "profile_logo"
                  }
                >
                  Naik
                </ActionButton>
                <ActionButton
                  operation="down"
                  pending={pending}
                  disabled={
                    pending ||
                    section.sectionKey === "profile_logo" ||
                    index === sections.length - 1 ||
                    sections[index + 1]?.sectionKey === "profile_logo"
                  }
                >
                  Turun
                </ActionButton>
                <ActionButton
                  operation={section.isActive ? "deactivate" : "activate"}
                  disabled={pending}
                  pending={pending}
                >
                  {section.isActive ? "Sembunyikan" : "Tampilkan"}
                </ActionButton>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ActionButton({
  operation,
  disabled,
  pending,
  children,
}: {
  operation: "up" | "down" | "activate" | "deactivate" | "title";
  disabled: boolean;
  pending: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      name="operation"
      value={operation}
      disabled={disabled}
      aria-busy={pending || undefined}
      className="min-h-11 cursor-pointer border border-border px-3 text-sm font-medium hover:border-[var(--kgj-accent)] hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
