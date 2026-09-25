"use client";

import { useActionState, useId } from "react";

import { FormFeedback } from "@/components/admin/admin-toast";
import { FormDialog } from "@/components/admin/form-dialog";
import { PageOrderControls } from "@/components/admin/page-order-controls";
import type { faqs } from "@/lib/db/schema";
import { saveFaq, startBranchFaqs } from "@/modules/admin/faqs/actions";

type FaqRecord = Pick<
  typeof faqs.$inferSelect,
  "id" | "branchId" | "question" | "answer" | "sortOrder" | "isActive"
>;

const inputClass =
  "mt-2 min-h-12 w-full rounded-sm border border-border bg-background px-4 py-2 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--kgj-accent)]";

export function FaqManager({
  faqs,
  branchId = null,
  inherits = false,
  sharedTemplate = false,
}: {
  faqs: FaqRecord[];
  branchId?: string | null;
  inherits?: boolean;
  sharedTemplate?: boolean;
}) {
  const [copyState, copyAction, copying] = useActionState(startBranchFaqs, {
    message: "",
    errors: {},
  });

  return (
    <section className="mt-6 rounded-2xl bg-card p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl">
            {sharedTemplate ? "Template FAQ bawaan" : "FAQ"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {sharedTemplate
              ? "Dipakai cabang hingga cabang menyalinnya menjadi FAQ khusus. Gunakan tombol Naik/Turun pada daftar untuk mengubah urutan template."
              : inherits
                ? "Cabang ini masih mengikuti template FAQ KGJ. Salin dahulu untuk mengubahnya khusus cabang."
                : "Atur pertanyaan, jawaban, dan status tampil. Gunakan tombol Naik/Turun pada daftar untuk mengubah urutan."}
          </p>
        </div>
        {inherits && branchId ? (
          <form action={copyAction}>
            <input type="hidden" name="branchId" value={branchId} />
            <button
              type="submit"
              disabled={copying}
              className="min-h-11 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-[var(--kgj-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
            >
              {copying ? "Menyalin..." : "Kustomisasi FAQ cabang"}
            </button>
            <FormFeedback state={copyState} pending={copying} />
          </form>
        ) : (
          <FormDialog title="Tambah FAQ" triggerLabel="Tambah FAQ" primary>
            <FaqForm faq={null} branchId={branchId} />
          </FormDialog>
        )}
      </div>

      {faqs.length === 0 ? (
        <p className="mt-6 border-t border-border pt-6 text-sm text-muted-foreground">
          Belum ada FAQ pada halaman ini.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-border border-t border-border">
          {faqs.map((faq, index) => (
            <li
              key={faq.id}
              className="flex flex-wrap items-center justify-between gap-4 py-4"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold break-words">{faq.question}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {faq.isActive ? "Aktif" : "Nonaktif"}
                </p>
              </div>
              {!inherits && (
                <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
                  <PageOrderControls
                    kind="faq"
                    id={faq.id}
                    branchId={branchId}
                    index={index}
                    count={faqs.length}
                  />
                  <FormDialog title="Edit FAQ" triggerLabel="Edit">
                    <FaqForm faq={faq} branchId={branchId} />
                  </FormDialog>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function FaqForm({
  faq,
  branchId,
}: {
  faq: FaqRecord | null;
  branchId: string | null;
}) {
  const formId = useId();
  const [state, action, pending] = useActionState(saveFaq, {
    message: "",
    errors: {},
  });

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="id" value={faq?.id ?? ""} />
      <input type="hidden" name="branchId" value={branchId ?? ""} />
      <input type="hidden" name="sortOrder" value={faq?.sortOrder ?? 0} />
      <div>
        <label htmlFor={`${formId}-question`} className="font-medium">
          Pertanyaan
        </label>
        <input
          id={`${formId}-question`}
          name="question"
          defaultValue={faq?.question ?? ""}
          required
          maxLength={200}
          className={inputClass}
        />
        {state.errors.question && (
          <p role="alert" className="mt-2 text-sm text-destructive">
            {state.errors.question}
          </p>
        )}
      </div>
      <div>
        <label htmlFor={`${formId}-answer`} className="font-medium">
          Jawaban
        </label>
        <textarea
          id={`${formId}-answer`}
          name="answer"
          defaultValue={faq?.answer ?? ""}
          required
          maxLength={4000}
          rows={8}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Baris baru akan tetap terlihat di halaman publik.
        </p>
        {state.errors.answer && (
          <p role="alert" className="mt-2 text-sm text-destructive">
            {state.errors.answer}
          </p>
        )}
      </div>
      <label className="flex min-h-11 items-center gap-3 border-t border-border pt-5 font-medium">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={faq?.isActive ?? true}
          className="size-5 accent-primary"
        />
        Aktif
      </label>
      <FormFeedback state={state} pending={pending} />
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending || undefined}
        className="min-h-12 bg-primary px-6 font-semibold text-primary-foreground hover:bg-[var(--kgj-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Simpan FAQ"}
      </button>
    </form>
  );
}
