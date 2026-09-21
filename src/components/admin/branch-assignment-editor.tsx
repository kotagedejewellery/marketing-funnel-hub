"use client";

import { useActionState } from "react";

import { FormFeedback } from "@/components/admin/admin-toast";
import { FormDialog } from "@/components/admin/form-dialog";
import { saveProductAssignments } from "@/modules/admin/assignments/actions";

type Assignment = {
  id: string;
  name: string;
  isBranchActive: boolean;
  isActive: boolean;
  sortOrder: number;
  ctaLabel: string;
  whatsappMessageTemplate: string;
  resolvedLabel: string;
  resolvedMessage: string;
  whatsappUrl: string;
};

const inputClass =
  "mt-2 min-h-11 w-full border border-border bg-background px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2";

export function BranchAssignmentEditor({
  productId,
  productIsActive,
  assignments,
}: {
  productId: string;
  productIsActive: boolean;
  assignments: Assignment[];
}) {
  const [state, action, pending] = useActionState(saveProductAssignments, {
    message: "",
    errors: {},
    ok: false,
  });
  const hasActiveBranch = assignments.some(
    (row) => row.isBranchActive && row.isActive,
  );

  return (
    <section
      className="mt-12 border-t border-border pt-8"
      aria-labelledby="assignment-heading"
    >
      <h2 id="assignment-heading" className="font-serif text-3xl">
        Cabang untuk produk ini
      </h2>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Tandai cabang yang melayani produk ini. Label dan pesan kosong mengikuti
        pengaturan bawaan.
      </p>
      {productIsActive && !hasActiveBranch && (
        <p
          role="status"
          className="mt-5 border border-border bg-secondary p-4 text-sm"
        >
          Produk aktif ini belum memiliki cabang aktif; tombol WhatsApp belum
          akan tampil.
        </p>
      )}
      {assignments.length === 0 ? (
        <p className="mt-6 text-muted-foreground">
          Belum ada cabang. Tambahkan cabang terlebih dahulu.
        </p>
      ) : (
        <div className="mt-6">
          <FormDialog
            title="Atur cabang produk"
            triggerLabel="Atur cabang"
            primary
          >
            <form action={action} className="space-y-5">
              <input type="hidden" name="productId" value={productId} />
              {assignments.map((row) => (
                <fieldset key={row.id} className="border border-border p-5">
                  <legend className="px-2 font-medium">{row.name}</legend>
                  <label className="flex min-h-11 items-center gap-3">
                    <input
                      type="checkbox"
                      name={`active:${row.id}`}
                      defaultChecked={row.isActive}
                      disabled={!row.isBranchActive}
                      className="size-5 accent-primary"
                    />
                    Tampilkan WhatsApp cabang ini
                  </label>
                  {!row.isBranchActive && (
                    <p className="text-sm text-muted-foreground">
                      Cabang nonaktif; aktifkan di halaman Cabang terlebih
                      dahulu.
                    </p>
                  )}
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor={`order:${row.id}`}
                        className="font-medium"
                      >
                        Urutan CTA
                      </label>
                      <input
                        id={`order:${row.id}`}
                        name={`order:${row.id}`}
                        type="number"
                        min={0}
                        max={2147483647}
                        defaultValue={row.sortOrder}
                        className={inputClass}
                        required
                      />
                      <FieldError
                        message={state.errors[`${row.id}:sortOrder`]}
                      />
                    </div>
                    <div>
                      <label htmlFor={`cta:${row.id}`} className="font-medium">
                        Label CTA khusus (opsional)
                      </label>
                      <input
                        id={`cta:${row.id}`}
                        name={`cta:${row.id}`}
                        defaultValue={row.ctaLabel}
                        className={inputClass}
                        maxLength={120}
                      />
                      <FieldError
                        message={state.errors[`${row.id}:ctaLabel`]}
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label
                      htmlFor={`message:${row.id}`}
                      className="font-medium"
                    >
                      Pesan WhatsApp khusus (opsional)
                    </label>
                    <textarea
                      id={`message:${row.id}`}
                      name={`message:${row.id}`}
                      defaultValue={row.whatsappMessageTemplate}
                      className={inputClass}
                      rows={2}
                      maxLength={500}
                      placeholder="Gunakan {product} dan {branch} bila perlu"
                    />
                    <FieldError
                      message={
                        state.errors[`${row.id}:whatsappMessageTemplate`]
                      }
                    />
                  </div>
                  <FieldError message={state.errors[`${row.id}:isActive`]} />
                  <div className="mt-4 border-t border-border pt-4 text-sm">
                    <p className="font-medium">Pratinjau dari data tersimpan</p>
                    {(!productIsActive ||
                      !row.isBranchActive ||
                      !row.isActive) && (
                      <p className="mt-1 text-muted-foreground">
                        CTA ini tidak tampil di halaman publik saat ini.
                      </p>
                    )}
                    <p className="mt-1">Label: {row.resolvedLabel}</p>
                    <p className="mt-1">Pesan: {row.resolvedMessage}</p>
                    <p className="mt-1 break-all">Tujuan: {row.whatsappUrl}</p>
                  </div>
                </fieldset>
              ))}
              <FormFeedback state={state} pending={pending} />
              <button
                type="submit"
                disabled={pending}
                className="min-h-11 bg-primary px-5 font-medium text-primary-foreground hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
              >
                {pending ? "Menyimpan..." : "Simpan cabang produk"}
              </button>
            </form>
          </FormDialog>
        </div>
      )}
    </section>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="mt-2 text-sm text-destructive">
      {message}
    </p>
  ) : null;
}
