import Link from "next/link";

import { BranchPageForm } from "@/components/admin/branch-page-form";
import { BranchPublicUrl } from "@/components/admin/branch-public-url";
import { CampaignForm } from "@/components/admin/campaign-form";
import { FormDialog } from "@/components/admin/form-dialog";
import { LinkForm } from "@/components/admin/link-form";
import { MediaUploadField } from "@/components/admin/media-upload-field";
import { serverEnv } from "@/lib/env/server";
import { getBranchPageSettings } from "@/modules/admin/branches/page-data";
import { publicAssetUrl } from "@/modules/public-content/links";

export default async function BranchLinkBioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { branch, sections, inheritsSections, campaigns, links, products } =
    await getBranchPageSettings((await params).id);
  const previewUrl = publicAssetUrl(
    serverEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_PUBLIC_ASSET_BUCKET,
    branch.logoPath,
  );

  return (
    <div>
      <Link
        href="/admin/branches"
        className="text-sm underline underline-offset-4"
      >
        Kembali ke cabang
      </Link>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl">Link Bio {branch.name}</h1>
          <p className="mt-3 text-muted-foreground">
            Konten halaman ini hanya berlaku untuk cabang {branch.name}.
          </p>
        </div>
      </div>
      <section className="mt-8 rounded-2xl bg-[var(--kgj-accent-soft)] p-6 sm:p-8">
        <h2 className="font-serif text-2xl">URL halaman cabang</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Bagikan URL ini setelah cabang aktif dan kontennya siap.
        </p>
        <BranchPublicUrl
          url={new URL(
            `/b/${branch.slug}`,
            serverEnv.NEXT_PUBLIC_SITE_URL,
          ).toString()}
          isActive={branch.isActive}
        />
      </section>
      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.7fr)]">
        <section className="rounded-2xl bg-card p-6 sm:p-8">
          <h2 className="font-serif text-2xl">Teks dan susunan</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Headline, pengantar, dan urutan bagian untuk halaman cabang.
          </p>
          <div className="mt-5">
            <FormDialog
              title={`Atur Link Bio ${branch.name}`}
              triggerLabel="Edit halaman"
              primary
            >
              <BranchPageForm
                branch={branch}
                sections={sections}
                inheritsSections={inheritsSections}
              />
            </FormDialog>
          </div>
        </section>
        <MediaUploadField
          entityType="branch"
          entityId={branch.id}
          label="Logo cabang"
          previewUrl={previewUrl}
        />
      </div>
      <section className="mt-6 rounded-2xl bg-card p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl">Produk cabang</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Tampilkan produk yang dilayani cabang ini dan atur nama,
              deskripsi, gambar, serta pesan WhatsApp-nya.
            </p>
          </div>
          <Link
            href="/admin/products"
            className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Kelola produk utama
          </Link>
        </div>
        {products.length === 0 ? (
          <p className="mt-5 border-t border-border py-6 text-sm text-muted-foreground">
            Belum ada produk utama. Tambahkan produk terlebih dahulu.
          </p>
        ) : (
          <ul className="mt-5 divide-y divide-border border-t border-border">
            {products.map((product) => (
              <li
                key={product.id}
                className="flex flex-wrap items-center justify-between gap-3 py-4"
              >
                <div className="min-w-0">
                  <p className="font-semibold">
                    {product.assignment?.displayName || product.name}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {!product.isActive
                      ? "Produk utama nonaktif"
                      : !branch.isActive
                        ? "Cabang nonaktif"
                        : product.assignment?.isActive
                          ? "Ditampilkan di cabang ini"
                          : "Belum ditampilkan di cabang ini"}
                  </p>
                </div>
                <Link
                  href={`/admin/products/${product.id}?branch=${branch.id}`}
                  className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  Atur untuk cabang ini
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl bg-card p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-serif text-2xl">Kampanye cabang</h2>
            <FormDialog title="Tambah kampanye cabang" triggerLabel="Tambah">
              <CampaignForm campaign={null} branchId={branch.id} />
            </FormDialog>
          </div>
          {campaigns.length === 0 ? (
            <p className="mt-5 text-sm text-muted-foreground">
              Belum ada kampanye cabang.
            </p>
          ) : (
            <ul className="mt-5 divide-y divide-border">
              {campaigns.map((campaign) => (
                <li
                  key={campaign.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-4"
                >
                  <div>
                    <p className="font-semibold">{campaign.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {campaign.isActive ? "Aktif" : "Nonaktif"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <FormDialog
                      title={`Edit ${campaign.name}`}
                      triggerLabel="Edit"
                    >
                      <CampaignForm campaign={campaign} />
                    </FormDialog>
                    <Link
                      href={`/admin/campaigns/${campaign.id}`}
                      className="text-sm underline underline-offset-4"
                    >
                      Banner
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-2xl bg-card p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-serif text-2xl">Tautan cabang</h2>
            <FormDialog title="Tambah tautan cabang" triggerLabel="Tambah">
              <LinkForm link={null} branchId={branch.id} />
            </FormDialog>
          </div>
          {links.length === 0 ? (
            <p className="mt-5 text-sm text-muted-foreground">
              Belum ada tautan cabang.
            </p>
          ) : (
            <ul className="mt-5 divide-y divide-border">
              {links.map((link) => (
                <li
                  key={link.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-4"
                >
                  <div>
                    <p className="font-semibold">{link.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {link.isActive ? "Aktif" : "Nonaktif"}
                    </p>
                  </div>
                  <FormDialog title={`Edit ${link.label}`} triggerLabel="Edit">
                    <LinkForm link={link} />
                  </FormDialog>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
