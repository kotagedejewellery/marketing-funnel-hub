import Link from "next/link";

import { BranchForm } from "@/components/admin/branch-form";
import { BranchPublicUrl } from "@/components/admin/branch-public-url";
import { FormDialog } from "@/components/admin/form-dialog";
import { serverEnv } from "@/lib/env/server";
import { getAllBranches } from "@/modules/admin/branches/data";

export default async function LinkBioPagesPage({
  searchParams,
}: {
  searchParams: Promise<{ create?: string }>;
}) {
  const { create } = await searchParams;
  const branches = await getAllBranches();

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl">Halaman Link Bio</h1>
          <p className="mt-3 text-muted-foreground">
            Satu Link Bio untuk setiap cabang. Pilih cabang untuk mengatur
            konten dan melihat pratinjaunya.
          </p>
        </div>
        <FormDialog
          key={create === "1" ? "create-open" : "create-closed"}
          title="Tambah Halaman Link Bio"
          triggerLabel="Tambah Halaman Link Bio"
          primary
          initiallyOpen={create === "1"}
        >
          <BranchForm branch={null} />
        </FormDialog>
      </div>
      <ul className="mt-8 grid gap-4 xl:grid-cols-2">
        {branches.map((branch) => (
          <li key={branch.id} className="rounded-2xl bg-card p-6 sm:p-8">
            <p className="text-sm font-semibold text-muted-foreground">
              Halaman cabang · {branch.isActive ? "Aktif" : "Nonaktif"}
            </p>
            <h2 className="mt-2 font-serif text-2xl">{branch.name}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Konten halaman dan WhatsApp khusus cabang ini.
            </p>
            <BranchPublicUrl
              url={new URL(
                `/${branch.slug}`,
                serverEnv.NEXT_PUBLIC_SITE_URL,
              ).toString()}
              isActive={branch.isActive}
            />
            <Link
              href={`/admin/branches/${branch.id}/link-bio`}
              className="mt-5 inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Kelola halaman
            </Link>
            <Link
              href={`/admin/preview/link-bio/${branch.id}`}
              target="_blank"
              className="ml-4 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4"
            >
              Pratinjau
            </Link>
          </li>
        ))}
      </ul>
      {branches.length === 0 && (
        <p className="mt-5 text-sm text-muted-foreground">
          Belum ada Halaman Link Bio. Tambahkan halaman untuk membuat cabang,
          URL publik, dan kontennya.
        </p>
      )}
    </div>
  );
}
