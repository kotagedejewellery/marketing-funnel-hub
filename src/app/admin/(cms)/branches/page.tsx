import Link from "next/link";

import { BranchForm } from "@/components/admin/branch-form";
import { FormDialog } from "@/components/admin/form-dialog";
import { getBranchList } from "@/modules/admin/branches/data";

export default async function BranchesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; create?: string }>;
}) {
  const { page: pageParam, create } = await searchParams;
  const requestedPage = Number(pageParam ?? 1);
  const { rows, page, pageCount } = await getBranchList(requestedPage);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl">Cabang</h1>
          <p className="mt-3 text-muted-foreground">
            Kelola tujuan WhatsApp tiap cabang.
          </p>
        </div>
        <FormDialog
          key={create === "1" ? "create-open" : "create-closed"}
          title="Tambah cabang"
          triggerLabel="Tambah cabang"
          primary
          initiallyOpen={create === "1"}
        >
          <BranchForm branch={null} />
        </FormDialog>
      </div>
      {rows.length === 0 ? (
        <p className="mt-8 border-t border-border py-7 text-muted-foreground">
          Belum ada cabang.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-border border-y border-border">
          {rows.map((branch) => (
            <li
              key={branch.id}
              className="flex flex-wrap items-center justify-between gap-4 py-5"
            >
              <div>
                <p className="font-medium">{branch.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {branch.isActive ? "Aktif" : "Nonaktif"} · Urutan{" "}
                  {branch.sortOrder} · {branch.whatsappNumber}
                </p>
              </div>
              <FormDialog title={`Edit ${branch.name}`} triggerLabel="Edit">
                <BranchForm branch={branch} />
              </FormDialog>
            </li>
          ))}
        </ul>
      )}
      <nav
        aria-label="Halaman cabang"
        className="mt-6 flex items-center gap-4 text-sm"
      >
        {page > 1 && (
          <Link
            href={`/admin/branches?page=${page - 1}`}
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
            href={`/admin/branches?page=${page + 1}`}
            className="underline underline-offset-4"
          >
            Berikutnya
          </Link>
        )}
      </nav>
    </div>
  );
}
