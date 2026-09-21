"use client";

import { useActionState, type ReactNode } from "react";

import { changeContentSection } from "@/modules/admin/content/actions";

type Section = { id: string; label: string; isActive: boolean };

export function SectionList({ sections }: { sections: Section[] }) {
  const [state, action, pending] = useActionState(changeContentSection, {
    message: "",
    errors: {},
  });

  return (
    <section
      className="mt-10 border border-border bg-card"
      aria-labelledby="section-order-heading"
    >
      <div className="border-b border-border px-5 py-5 sm:px-6">
        <h2 id="section-order-heading" className="font-serif text-2xl">
          Susunan bagian
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Urutan lebih atas akan tampil lebih dahulu pada Link Bio.
        </p>
      </div>
      <p role="status" aria-live="polite" className="px-5 text-sm sm:px-6">
        {state.message}
      </p>
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
                <ActionButton operation="up" disabled={pending || index === 0}>
                  Naik
                </ActionButton>
                <ActionButton
                  operation="down"
                  disabled={pending || index === sections.length - 1}
                >
                  Turun
                </ActionButton>
                <ActionButton
                  operation={section.isActive ? "deactivate" : "activate"}
                  disabled={pending}
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
  children,
}: {
  operation: "up" | "down" | "activate" | "deactivate";
  disabled: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      name="operation"
      value={operation}
      disabled={disabled}
      className="min-h-11 cursor-pointer border border-border px-3 text-sm font-medium hover:border-[var(--kgj-accent)] hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
