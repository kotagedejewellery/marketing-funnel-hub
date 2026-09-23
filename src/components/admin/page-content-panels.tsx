import { CampaignForm } from "@/components/admin/campaign-form";
import { FormDialog } from "@/components/admin/form-dialog";
import { LinkForm } from "@/components/admin/link-form";
import { MediaUploadField } from "@/components/admin/media-upload-field";
import { PageOrderControls } from "@/components/admin/page-order-controls";
import { campaigns, links } from "@/lib/db/schema";
import { serverEnv } from "@/lib/env/server";
import { publicAssetUrl } from "@/modules/public-content/links";

type Campaign = typeof campaigns.$inferSelect;
type PageLink = typeof links.$inferSelect;

export function PageCampaigns({
  rows,
  branchId = null,
}: {
  rows: Campaign[];
  branchId?: string | null;
}) {
  return (
    <section
      className="rounded-2xl bg-card p-6 sm:p-8"
      aria-labelledby="page-campaigns"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="page-campaigns" className="font-serif text-2xl">
            Konten unggulan
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Maksimal satu konten unggulan aktif tampil setelah profil.
          </p>
        </div>
        <FormDialog title="Tambah konten unggulan" triggerLabel="Tambah konten">
          <CampaignForm campaign={null} branchId={branchId} stayOnPage />
        </FormDialog>
      </div>
      {rows.length === 0 ? (
        <p className="mt-5 border-t border-border pt-5 text-sm text-muted-foreground">
          Belum ada konten unggulan untuk halaman ini.
        </p>
      ) : (
        <ul className="mt-5 divide-y divide-border border-t border-border">
          {rows.map((row) => (
            <li key={row.id} className="py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{row.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {row.isActive ? "Aktif" : "Nonaktif"} ·{" "}
                    {row.bannerPath ? "Ada banner" : "Tanpa banner"}
                  </p>
                </div>
                <FormDialog
                  title={`Edit ${row.name}`}
                  triggerLabel="Edit konten"
                >
                  <CampaignForm campaign={row} stayOnPage />
                </FormDialog>
              </div>
              <details className="mt-3 group">
                <summary className="cursor-pointer text-sm font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2">
                  Atur gambar konten unggulan
                </summary>
                <div className="mt-3">
                  <MediaUploadField
                    entityType="campaign"
                    entityId={row.id}
                    label={`Banner ${row.name}`}
                    previewUrl={publicAssetUrl(
                      serverEnv.NEXT_PUBLIC_SUPABASE_URL,
                      serverEnv.SUPABASE_PUBLIC_ASSET_BUCKET,
                      row.bannerPath,
                    )}
                  />
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function PageLinks({
  rows,
  branchId = null,
}: {
  rows: PageLink[];
  branchId?: string | null;
}) {
  const groups = [
    {
      label: "Tautan tambahan",
      rows: rows.filter((row) => row.linkType === "secondary"),
    },
    {
      label: "Media sosial",
      rows: rows.filter((row) => row.linkType === "social"),
    },
  ];
  return (
    <section
      className="rounded-2xl bg-card p-6 sm:p-8"
      aria-labelledby="page-links"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="page-links" className="font-serif text-2xl">
            Tautan tambahan
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tautan tambahan dan media sosial halaman ini.
          </p>
        </div>
        <FormDialog title="Tambah tautan" triggerLabel="Tambah tautan">
          <LinkForm link={null} branchId={branchId} stayOnPage />
        </FormDialog>
      </div>
      {rows.length === 0 ? (
        <p className="mt-5 border-t border-border pt-5 text-sm text-muted-foreground">
          Belum ada tautan untuk halaman ini.
        </p>
      ) : (
        <div className="mt-5 space-y-5">
          {groups
            .filter((group) => group.rows.length > 0)
            .map((group) => (
              <div key={group.label}>
                <h3 className="font-semibold">{group.label}</h3>
                <ul className="mt-2 divide-y divide-border border-t border-border">
                  {group.rows.map((row, index) => (
                    <li
                      key={row.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-4"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold">{row.label}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {row.isActive ? "Aktif" : "Nonaktif"}
                        </p>
                        <p
                          className="mt-1 truncate text-sm text-muted-foreground"
                          title={row.url}
                        >
                          {row.url}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <PageOrderControls
                          kind="link"
                          id={row.id}
                          branchId={branchId}
                          index={index}
                          count={group.rows.length}
                        />
                        <FormDialog
                          title={`Edit ${row.label}`}
                          triggerLabel="Edit"
                        >
                          <LinkForm link={row} stayOnPage />
                        </FormDialog>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      )}
    </section>
  );
}
