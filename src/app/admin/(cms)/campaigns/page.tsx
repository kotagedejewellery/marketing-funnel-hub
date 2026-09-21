import Link from "next/link";

import { CampaignForm } from "@/components/admin/campaign-form";
import { FormDialog } from "@/components/admin/form-dialog";
import { getCampaignList } from "@/modules/admin/campaigns/data";

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; create?: string }>;
}) {
  const { page: pageParam, create } = await searchParams;
  const requestedPage = Number(pageParam ?? 1);
  const { rows, page, pageCount, hasOverlap } =
    await getCampaignList(requestedPage);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--kgj-accent)] uppercase">
            Promosi
          </p>
          <h1 className="mt-3 font-serif text-4xl sm:text-5xl">Kampanye</h1>
          <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
            Kelola kampanye yang dapat tampil di Link Bio.
          </p>
        </div>
        <FormDialog
          key={create === "1" ? "create-open" : "create-closed"}
          title="Tambah kampanye"
          triggerLabel="Tambah kampanye"
          primary
          initiallyOpen={create === "1"}
        >
          <CampaignForm campaign={null} />
        </FormDialog>
      </div>
      {hasOverlap && (
        <p
          role="status"
          className="mt-8 border-l-2 border-[var(--kgj-accent)] bg-secondary px-5 py-4 text-sm leading-6"
        >
          Beberapa jadwal kampanye aktif saling tumpang tindih. Halaman publik
          tetap memilih satu berdasarkan urutan prioritas.
        </p>
      )}
      {rows.length === 0 ? (
        <p className="mt-8 border border-border bg-card px-6 py-10 text-muted-foreground">
          Belum ada kampanye. Tambahkan kampanye untuk menyiapkan banner publik.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-border border border-border bg-card">
          {rows.map((campaign) => (
            <li
              key={campaign.id}
              className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-6"
            >
              <div>
                <p className="font-semibold">{campaign.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {campaign.isActive ? "Aktif" : "Nonaktif"} · Prioritas{" "}
                  {campaign.sortOrder}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <FormDialog title={`Edit ${campaign.name}`} triggerLabel="Edit">
                  <CampaignForm campaign={campaign} />
                </FormDialog>
                <Link
                  href={`/admin/campaigns/${campaign.id}`}
                  className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  Kelola banner
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
      <nav
        aria-label="Halaman kampanye"
        className="mt-6 flex flex-wrap items-center gap-4 text-sm"
      >
        {page > 1 && (
          <Link
            href={`/admin/campaigns?page=${page - 1}`}
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
            href={`/admin/campaigns?page=${page + 1}`}
            className="underline underline-offset-4"
          >
            Berikutnya
          </Link>
        )}
      </nav>
    </div>
  );
}
