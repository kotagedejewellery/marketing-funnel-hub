import Link from "next/link";

import { FormDialog } from "@/components/admin/form-dialog";
import { LinkForm } from "@/components/admin/link-form";
import { getLinkList } from "@/modules/admin/links/data";

export default async function LinksPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; create?: string }>;
}) {
  const { page: pageParam, create } = await searchParams;
  const requestedPage = Number(pageParam ?? 1);
  const { rows, page, pageCount } = await getLinkList(requestedPage);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--kgj-accent)] uppercase">
            Destinasi
          </p>
          <h1 className="mt-3 font-serif text-4xl sm:text-5xl">
            Tautan halaman gabungan
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
            Tautan di sini hanya tampil pada URL utama (/). Tautan tiap cabang
            dikelola dari halaman Link Bio cabang.
          </p>
        </div>
        <FormDialog
          key={create === "1" ? "create-open" : "create-closed"}
          title="Tambah tautan halaman gabungan"
          triggerLabel="Tambah tautan"
          primary
          initiallyOpen={create === "1"}
        >
          <LinkForm link={null} />
        </FormDialog>
      </div>
      {rows.length === 0 ? (
        <p className="mt-8 border border-border bg-card px-6 py-10 text-muted-foreground">
          Belum ada tautan. Tambahkan tautan tambahan atau kanal sosial untuk
          Link Bio.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-border border border-border bg-card">
          {rows.map((link) => (
            <li
              key={link.id}
              className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-6"
            >
              <div className="min-w-0">
                <p className="font-semibold">{link.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {link.linkType === "social" ? "Sosial" : "Tambahan"} ·{" "}
                  {link.isActive ? "Aktif" : "Nonaktif"} · Urutan{" "}
                  {link.sortOrder}
                </p>
                <p className="mt-1 break-all text-sm text-muted-foreground">
                  {link.url}
                </p>
              </div>
              <FormDialog title={`Edit ${link.label}`} triggerLabel="Edit">
                <LinkForm link={link} />
              </FormDialog>
            </li>
          ))}
        </ul>
      )}
      <nav
        aria-label="Halaman tautan"
        className="mt-6 flex flex-wrap items-center gap-4 text-sm"
      >
        {page > 1 && (
          <Link
            href={`/admin/links?page=${page - 1}`}
            className="underline underline-offset-4"
          >
            Sebelumnya
          </Link>
        )}
        <span>
          Halaman {page} dari {pageCount}
        </span>
        {page < pageCount && (
          <Link
            href={`/admin/links?page=${page + 1}`}
            className="underline underline-offset-4"
          >
            Berikutnya
          </Link>
        )}
      </nav>
    </div>
  );
}
