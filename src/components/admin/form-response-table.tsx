"use client";

import { type FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Filters = {
  branchId: string | null;
  formId: string | null;
  productBranchId: string | null;
  start: string | null;
  end: string | null;
  whatsappStatus: "continued" | "pending" | null;
  cursor?: string | null;
  page?: number;
};

type Row = {
  id: string;
  branchId?: string;
  formBlockId?: string;
  submittedAt: Date;
  whatsappContinuedAt: Date | null;
  formTitle: string;
  branchName: string;
  productName: string;
  hasIdentitySummary?: boolean;
  identity?: { name: string | null; contact: string | null } | null;
  identityConfiguration?: "needs_setup" | "needs_publish" | "ready";
  googleSheetsStatus: string | null;
  googleSheetsRetryable?: boolean;
};

type Detail = {
  title: string;
  decryptable: boolean;
  values: { label: string; value: string }[];
};

function formatDate(value: Date) {
  return `${new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(value)} WIB`;
}

function queryFor(filters: Filters, override: Partial<Filters> = {}) {
  const values = { ...filters, ...override };
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value) query.set(key, String(value));
  }
  return query.toString() ? `?${query}` : "";
}

function googleSheetsStatus(status: Row["googleSheetsStatus"]) {
  if (status === "delivered") return "Google Sheets terkirim";
  if (status === "failed") return "Google Sheets gagal";
  if (status === "pending") return "Google Sheets menunggu";
  if (status === "delivering") return "Google Sheets sedang dikirim";
  if (status === "unknown") return "Periksa Google Sheets: status tidak pasti";
  return null;
}

function canRetryGoogleSheets(row: Row) {
  return (
    row.googleSheetsRetryable ??
    ["pending", "failed"].includes(row.googleSheetsStatus ?? "")
  );
}

function formIdentityBuilderHref(row: Row) {
  if (!row.branchId || !row.formBlockId) return null;
  return `/admin/branches/${row.branchId}/link-bio?form=${row.formBlockId}`;
}

function identityActionState(row: Row) {
  if (row.identity || row.hasIdentitySummary || !formIdentityBuilderHref(row))
    return null;
  return row.identityConfiguration ?? "needs_setup";
}

function IdentityAction({
  row,
  onBackfill,
  backfilling,
  unavailable,
  className = "",
}: {
  row: Row;
  onBackfill: (row: Row) => void;
  backfilling: boolean;
  unavailable: boolean;
  className?: string;
}) {
  const state = identityActionState(row);
  const href = formIdentityBuilderHref(row);
  if (!state || !href) return null;

  if (state === "ready") {
    return (
      <button
        type="button"
        onClick={() => onBackfill(row)}
        disabled={backfilling || unavailable}
        className={`min-h-11 whitespace-nowrap rounded-full border border-border px-4 text-xs font-bold hover:bg-secondary disabled:opacity-50 ${className}`}
      >
        {backfilling ? "Memperbarui..." : "Tampilkan pengisi di daftar"}
      </button>
    );
  }

  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 whitespace-nowrap items-center rounded-full border border-border px-4 text-xs font-bold hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 ${className}`}
    >
      {state === "needs_publish"
        ? "Terbitkan identitas Form"
        : "Atur identitas Form"}
    </Link>
  );
}

export function FormResponseTable({
  filters,
  total,
  summary,
  nextCursor,
  rows,
  branches,
  forms,
  products,
  filterError,
}: {
  filters: Filters;
  total: number;
  summary: { submitted: number; continued: number };
  nextCursor?: string | null;
  pageCount?: number;
  rows: Row[];
  branches: { id: string; name: string }[];
  forms: { id: string; title: string }[];
  products: { id: string; productName: string; branchName: string }[];
  filterError: boolean;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailError, setDetailError] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [backfillingFormId, setBackfillingFormId] = useState<string | null>(
    null,
  );
  const [backfillCursors, setBackfillCursors] = useState<
    Record<string, string | null | undefined>
  >({});
  const [identityMessage, setIdentityMessage] = useState("");
  const [contactQuery, setContactQuery] = useState("");
  const [contactRows, setContactRows] = useState<Row[] | null>(null);
  const [contactMessage, setContactMessage] = useState("");
  const activeDetailId = useRef<string | null>(null);

  async function openDetail(id: string) {
    setDetail(null);
    setDetailError("");
    setLoadingId(id);
    activeDetailId.current = id;
    dialogRef.current?.showModal();
    try {
      const response = await fetch(`/api/admin/form-responses/${id}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error();
      const next = (await response.json()) as Detail;
      if (activeDetailId.current === id) setDetail(next);
    } catch {
      if (activeDetailId.current === id)
        setDetailError(
          "Respons belum dapat dimuat. Tutup dialog lalu coba lagi.",
        );
    } finally {
      if (activeDetailId.current === id) setLoadingId(null);
    }
  }

  async function retryGoogleSheets(id: string) {
    setRetryingId(id);
    setDeliveryMessage("");
    try {
      const response = await fetch(
        `/api/admin/form-responses/${id}/google-sheets/retry`,
        { method: "POST", headers: { "Content-Type": "application/json" } },
      );
      if (!response.ok) throw new Error();
      setDeliveryMessage("Google Sheets berhasil dicoba ulang.");
      window.location.reload();
    } catch {
      setDeliveryMessage("Google Sheets belum dapat dikirim ulang. Coba lagi.");
    } finally {
      setRetryingId(null);
    }
  }

  async function backfillIdentity(row: Row) {
    const { branchId, formBlockId } = row;
    if (!branchId || !formBlockId) return;
    const cursor = backfillCursors[formBlockId];
    if (cursor === null) return;
    setBackfillingFormId(formBlockId);
    setIdentityMessage("");
    try {
      const response = await fetch(
        "/api/admin/form-responses/identity-backfill",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            branchId,
            formId: formBlockId,
            ...(cursor ? { cursor } : {}),
          }),
        },
      );
      const result = (await response.json()) as {
        ok?: boolean;
        code?: string;
        updated?: number;
        skipped?: number;
        nextCursor?: string | null;
      };
      if (
        response.status === 422 &&
        result.code === "identity_not_configured"
      ) {
        setIdentityMessage(
          "Atur Nama pengisi dan Kontak pengisi pada Builder, lalu terbitkan Form terlebih dahulu.",
        );
        return;
      }
      if (!response.ok || !result.ok) throw new Error();
      setBackfillCursors((current) => ({
        ...current,
        [formBlockId]: result.nextCursor ?? null,
      }));
      setIdentityMessage(
        result.nextCursor
          ? `Identitas diperbarui untuk ${result.updated ?? 0} respons. Jalankan lagi untuk batch berikutnya.`
          : `Identitas diperbarui untuk ${result.updated ?? 0} respons${result.skipped ? `; ${result.skipped} respons dilewati.` : "."}`,
      );
      router.refresh();
    } catch {
      setIdentityMessage("Identitas belum dapat diperbarui. Coba lagi.");
    } finally {
      setBackfillingFormId(null);
    }
  }

  async function searchContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setContactMessage("");
    setContactRows(null);
    try {
      const response = await fetch("/api/admin/form-responses/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: contactQuery }),
      });
      const result = (await response.json()) as { ok?: boolean; rows?: Row[] };
      if (!response.ok || !result.ok || !result.rows) throw new Error();
      setContactRows(result.rows);
      setContactMessage(`${result.rows.length} respons ditemukan.`);
    } catch {
      setContactMessage("Kontak belum dapat dicari. Coba lagi.");
    }
  }

  const visibleRows = contactRows ?? rows;
  const hasIdentityGuidance = visibleRows.some((row) => {
    const state = identityActionState(row);
    return state === "needs_setup" || state === "needs_publish";
  });
  const hasGoogleSheetsDelivery = visibleRows.some(
    (row) => row.googleSheetsStatus !== null,
  );

  return (
    <section
      className="rounded-2xl bg-card p-6 sm:p-8"
      aria-labelledby="form-response-heading"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1
            id="form-response-heading"
            className="font-serif text-4xl sm:text-5xl"
          >
            Respons Form
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Tinjau respons terenkripsi. Daftar hanya menampilkan nama dan kontak
            yang disamarkan; pilih <strong>Lihat data pengisi</strong> untuk
            jawaban lengkap.
          </p>
        </div>
        <div className="text-right text-sm tabular-nums">
          <p className="font-semibold">{total} respons cocok</p>
          <p className="mt-1 text-muted-foreground">
            {summary.continued} dari {summary.submitted} lanjut WhatsApp
          </p>
        </div>
      </div>
      {hasIdentityGuidance && (
        <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">
          <strong className="text-foreground">
            Nama customer belum tampil di daftar.
          </strong>{" "}
          Gunakan aksi identitas Form pada respons terkait. Setelah pengaturan
          diterbitkan, tampilkan pengisi untuk respons lama bila diperlukan.
        </p>
      )}
      {identityMessage && (
        <p className="mt-4 text-sm" role="status">
          {identityMessage}
        </p>
      )}

      <form onSubmit={searchContact} className="mt-5 flex flex-wrap gap-3">
        <label className="min-w-[16rem] flex-1 text-sm font-semibold">
          Cari nomor atau email pengisi
          <input
            value={contactQuery}
            onChange={(event) => setContactQuery(event.target.value)}
            className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 font-normal"
          />
        </label>
        <button
          type="submit"
          className="mt-6 min-h-11 rounded-full border border-border px-5 text-sm font-bold hover:bg-secondary"
        >
          Cari kontak
        </button>
        {contactRows && (
          <button
            type="button"
            onClick={() => {
              setContactRows(null);
              setContactMessage("");
              setContactQuery("");
            }}
            className="mt-6 min-h-11 px-3 text-sm font-semibold underline underline-offset-4"
          >
            Kembali ke daftar
          </button>
        )}
      </form>
      {contactMessage && (
        <p role="status" className="mt-2 text-sm text-muted-foreground">
          {contactMessage}
        </p>
      )}

      <form
        method="get"
        className="mt-7 grid gap-4 border-y border-border py-5 md:grid-cols-2 xl:grid-cols-6"
      >
        <FilterSelect
          name="branchId"
          label="Cabang"
          value={filters.branchId ?? ""}
          options={branches.map((branch) => ({
            value: branch.id,
            label: branch.name,
          }))}
          allLabel="Semua cabang"
        />
        <FilterSelect
          name="formId"
          label="Form"
          value={filters.formId ?? ""}
          options={forms.map((form) => ({ value: form.id, label: form.title }))}
          allLabel="Semua form"
        />
        <FilterSelect
          name="productBranchId"
          label="CTA WhatsApp"
          value={filters.productBranchId ?? ""}
          options={products.map((product) => ({
            value: product.id,
            label: `${product.productName} — ${product.branchName}`,
          }))}
          allLabel="Semua CTA"
        />
        <FilterSelect
          name="whatsappStatus"
          label="Status WhatsApp"
          value={filters.whatsappStatus ?? ""}
          options={[
            { value: "continued", label: "Lanjut WhatsApp diklik" },
            { value: "pending", label: "Belum dilanjutkan" },
          ]}
          allLabel="Semua status"
        />
        <label className="block text-sm font-semibold">
          Dari tanggal
          <input
            type="date"
            name="start"
            defaultValue={filters.start ?? ""}
            className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 font-normal"
          />
        </label>
        <label className="block text-sm font-semibold">
          Sampai tanggal
          <input
            type="date"
            name="end"
            defaultValue={filters.end ?? ""}
            className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 font-normal"
          />
        </label>
        <div className="flex flex-wrap gap-3 md:col-span-2 xl:col-span-6">
          <button
            type="submit"
            className="min-h-11 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Terapkan filter
          </button>
          {filterError ? (
            <span className="inline-flex min-h-11 items-center px-3 text-sm text-muted-foreground">
              Perbaiki filter sebelum export.
            </span>
          ) : (
            <a
              href={`/api/admin/forms/export${queryFor(filters, { cursor: null })}`}
              className="inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-bold hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Export CSV (maks. 1.000)
            </a>
          )}
          <Link
            href="/admin/form-responses"
            className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold underline underline-offset-4"
          >
            Reset filter
          </Link>
        </div>
      </form>
      {filterError && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          Filter tidak valid. Menampilkan seluruh respons; periksa kembali
          rentang tanggal atau tautannya.
        </p>
      )}
      {deliveryMessage && (
        <p role="status" className="mt-4 text-sm text-muted-foreground">
          {deliveryMessage}
        </p>
      )}

      {visibleRows.length ? (
        <>
          <div className="mt-6 space-y-3 md:hidden">
            {visibleRows.map((row) => (
              <article key={row.id} className="border border-border p-4">
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">
                      Waktu
                    </dt>
                    <dd className="mt-1 tabular-nums">
                      {new Intl.DateTimeFormat("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "Asia/Jakarta",
                      }).format(row.submittedAt)}{" "}
                      WIB
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">
                      Pengisi
                    </dt>
                    <dd className="mt-1">
                      <span className="font-semibold">
                        {row.identity?.name ?? "Identitas belum ditetapkan"}
                      </span>
                      {row.identity?.contact && (
                        <span className="block text-muted-foreground">
                          {row.identity.contact}
                        </span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">
                      Cabang / CTA WhatsApp
                    </dt>
                    <dd className="mt-1">
                      {row.branchName} · {row.productName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">
                      Form
                    </dt>
                    <dd className="mt-1 font-semibold">{row.formTitle}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">
                      WhatsApp
                    </dt>
                    <dd className="mt-1 tabular-nums">
                      {row.whatsappContinuedAt
                        ? `Lanjut diklik ${formatDate(row.whatsappContinuedAt)}`
                        : "Belum dilanjutkan"}
                    </dd>
                  </div>
                  {googleSheetsStatus(row.googleSheetsStatus) && (
                    <div>
                      <dt className="text-xs font-semibold text-muted-foreground">
                        Google Sheets
                      </dt>
                      <dd className="mt-1">
                        {googleSheetsStatus(row.googleSheetsStatus)}
                      </dd>
                    </div>
                  )}
                </dl>
                <button
                  type="button"
                  onClick={() => openDetail(row.id)}
                  disabled={loadingId === row.id}
                  className="mt-4 min-h-11 whitespace-nowrap rounded-full bg-primary px-4 text-xs font-bold text-primary-foreground hover:bg-[var(--kgj-accent)] disabled:opacity-50"
                >
                  {loadingId === row.id ? "Memuat..." : "Lihat data pengisi"}
                </button>
                <IdentityAction
                  row={row}
                  onBackfill={backfillIdentity}
                  backfilling={backfillingFormId === row.formBlockId}
                  unavailable={backfillCursors[row.formBlockId ?? ""] === null}
                  className="ml-2 mt-4"
                />
                {canRetryGoogleSheets(row) && (
                  <button
                    type="button"
                    onClick={() => retryGoogleSheets(row.id)}
                    disabled={retryingId === row.id}
                    className="ml-2 mt-4 min-h-11 rounded-full border border-border px-4 text-xs font-bold hover:bg-secondary disabled:opacity-50"
                  >
                    {retryingId === row.id
                      ? "Mengirim ulang..."
                      : "Kirim ulang Google Sheets"}
                  </button>
                )}
              </article>
            ))}
          </div>
          <div className="mt-6 hidden overflow-x-auto border border-border md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-secondary text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th className="px-5 py-3">Waktu</th>
                  <th className="px-5 py-3">Pengisi</th>
                  {hasGoogleSheetsDelivery && (
                    <th className="px-5 py-3">Google Sheets</th>
                  )}
                  <th className="px-5 py-3">Cabang</th>
                  <th className="px-5 py-3">Form</th>
                  <th className="px-5 py-3">CTA WhatsApp</th>
                  <th className="px-5 py-3">Status WhatsApp</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visibleRows.map((row) => (
                  <tr key={row.id}>
                    <td className="whitespace-nowrap px-5 py-4 tabular-nums">
                      {new Intl.DateTimeFormat("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "Asia/Jakarta",
                      }).format(row.submittedAt)}{" "}
                      WIB
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <p className="font-semibold">
                        {row.identity?.name ?? "Identitas belum ditetapkan"}
                      </p>
                      {row.identity?.contact && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {row.identity.contact}
                        </p>
                      )}
                    </td>
                    {hasGoogleSheetsDelivery && (
                      <td className="whitespace-nowrap px-5 py-4">
                        {googleSheetsStatus(row.googleSheetsStatus) ??
                          "Tidak digunakan"}
                      </td>
                    )}
                    <td className="px-5 py-4 font-medium">{row.branchName}</td>
                    <td className="px-5 py-4">{row.formTitle}</td>
                    <td className="px-5 py-4">{row.productName}</td>
                    <td className="whitespace-nowrap px-5 py-4 tabular-nums">
                      {row.whatsappContinuedAt
                        ? `Lanjut diklik ${formatDate(row.whatsappContinuedAt)}`
                        : "Belum dilanjutkan"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {canRetryGoogleSheets(row) && (
                          <button
                            type="button"
                            onClick={() => retryGoogleSheets(row.id)}
                            disabled={retryingId === row.id}
                            className="min-h-11 whitespace-nowrap rounded-full border border-border px-4 text-xs font-bold hover:bg-secondary disabled:opacity-50"
                          >
                            {retryingId === row.id
                              ? "Mengirim ulang..."
                              : "Kirim ulang Sheets"}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openDetail(row.id)}
                          disabled={loadingId === row.id}
                          className="min-h-11 whitespace-nowrap rounded-full bg-primary px-4 text-xs font-bold text-primary-foreground hover:bg-[var(--kgj-accent)] disabled:opacity-50"
                        >
                          {loadingId === row.id
                            ? "Memuat..."
                            : "Lihat data pengisi"}
                        </button>
                        <IdentityAction
                          row={row}
                          onBackfill={backfillIdentity}
                          backfilling={backfillingFormId === row.formBlockId}
                          unavailable={
                            backfillCursors[row.formBlockId ?? ""] === null
                          }
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="mt-6 border-y border-border py-8">
          <h2 className="font-serif text-2xl">Tidak ada respons yang cocok</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Ubah filter atau tunggu respons baru masuk.
          </p>
        </div>
      )}

      {!contactRows && nextCursor && (
        <nav
          aria-label="Halaman respons form"
          className="mt-5 flex items-center justify-between gap-4 text-sm"
        >
          <a
            href={queryFor(filters, { cursor: nextCursor })}
            className="ml-auto font-semibold underline underline-offset-4"
          >
            Berikutnya
          </a>
        </nav>
      )}

      <dialog
        ref={dialogRef}
        aria-labelledby="response-detail-title"
        onClose={() => {
          activeDetailId.current = null;
          setDetail(null);
          setDetailError("");
          setLoadingId(null);
        }}
        className="kgj-admin-dialog m-auto max-h-[calc(100dvh-2rem)] w-[min(36rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border-0 bg-card p-0 text-foreground shadow-[0_24px_80px_-24px_rgba(40,33,28,0.5)] backdrop:bg-[rgba(40,33,28,0.6)]"
      >
        <div className="sticky top-0 flex items-center justify-between gap-4 border-b border-border bg-card px-6 py-4">
          <h2 id="response-detail-title" className="font-serif text-2xl">
            {detail?.title ?? "Respons form"}
          </h2>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="min-h-11 rounded-full bg-secondary px-4 text-sm font-bold"
          >
            Tutup
          </button>
        </div>
        <div className="px-6 py-6">
          {loadingId ? (
            <p role="status" className="text-sm text-muted-foreground">
              Memuat respons terenkripsi...
            </p>
          ) : detailError ? (
            <p role="alert" className="text-sm text-destructive">
              {detailError}
            </p>
          ) : detail?.decryptable ? (
            <dl className="space-y-4">
              {detail.values.map((value, index) => (
                <div key={`${value.label}-${index}`}>
                  <dt className="text-sm font-semibold text-muted-foreground">
                    {value.label}
                  </dt>
                  <dd className="mt-1 break-words">{value.value || "—"}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-destructive">
              Respons tidak dapat didekripsi.
            </p>
          )}
        </div>
      </dialog>
    </section>
  );
}

function FilterSelect({
  name,
  label,
  value,
  options,
  allLabel,
}: {
  name: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  allLabel: string;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <select
        name={name}
        defaultValue={value}
        className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 font-normal"
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
