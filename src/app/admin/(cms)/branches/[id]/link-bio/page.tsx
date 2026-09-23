import Link from "next/link";

import { BranchForm } from "@/components/admin/branch-form";
import { BranchPageForm } from "@/components/admin/branch-page-form";
import { BranchProductManager } from "@/components/admin/branch-product-manager";
import { BranchPublicUrl } from "@/components/admin/branch-public-url";
import { FaqManager } from "@/components/admin/faq-manager";
import { FormDialog } from "@/components/admin/form-dialog";
import { GalleryManager } from "@/components/admin/gallery-manager";
import { MediaUploadField } from "@/components/admin/media-upload-field";
import {
  PageCampaigns,
  PageLinks,
} from "@/components/admin/page-content-panels";
import { PagePreview } from "@/components/admin/page-preview";
import { serverEnv } from "@/lib/env/server";
import { getBranchPageSettings } from "@/modules/admin/branches/page-data";
import { publicAssetUrl } from "@/modules/public-content/links";

export default async function BranchLinkBioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const {
    branch,
    sections,
    inheritsSections,
    campaigns,
    gallery,
    links,
    faqs,
    inheritsFaqs,
    products,
  } = await getBranchPageSettings((await params).id);
  const assetUrl = (path: string | null) =>
    publicAssetUrl(
      serverEnv.NEXT_PUBLIC_SUPABASE_URL,
      serverEnv.SUPABASE_PUBLIC_ASSET_BUCKET,
      path,
    );

  return (
    <div>
      <Link
        href="/admin/link-bio"
        className="text-sm underline underline-offset-4"
      >
        Kembali ke semua halaman
      </Link>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl">Link Bio {branch.name}</h1>
          <p className="mt-3 text-muted-foreground">
            Semua isi di bawah ini hanya berlaku untuk cabang {branch.name}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href={`/admin/preview/link-bio/${branch.id}`}
            target="_blank"
            className="text-sm font-semibold underline underline-offset-4"
          >
            Buka pratinjau
          </Link>
          <FormDialog
            title={`Edit informasi ${branch.name}`}
            triggerLabel="Edit info & WhatsApp"
          >
            <BranchForm branch={branch} />
          </FormDialog>
        </div>
      </div>
      <section className="mt-8 rounded-2xl bg-[var(--kgj-accent-soft)] p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl">URL halaman</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {branch.isActive
                ? "Perubahan yang disimpan langsung tampil pada halaman publik."
                : "Cabang nonaktif: pratinjau tersedia, URL publik belum bisa dibuka."}
            </p>
            <BranchPublicUrl
              url={new URL(
                `/${branch.slug}`,
                serverEnv.NEXT_PUBLIC_SITE_URL,
              ).toString()}
              isActive={branch.isActive}
            />
            <p className="mt-3 text-sm text-muted-foreground">
              WhatsApp: {branch.whatsappNumber}
            </p>
          </div>
          <span className="rounded-full bg-card px-4 py-2 text-sm font-semibold">
            {branch.isActive ? "Aktif" : "Nonaktif"}
          </span>
        </div>
      </section>
      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.7fr)]">
        <div className="min-w-0 space-y-6">
          <section className="rounded-2xl bg-card p-6 sm:p-8">
            <h2 className="font-serif text-2xl">Profil merek</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {branch.headline || "Judul mengikuti Pengaturan Bersama."}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {branch.introduction
                ? "Deskripsi singkat khusus cabang sudah diisi."
                : "Deskripsi singkat mengikuti Pengaturan Bersama."}
            </p>
            <div className="mt-5">
              <FormDialog
                title={`Edit profil ${branch.name}`}
                triggerLabel="Edit profil"
                primary
              >
                <BranchPageForm
                  branch={branch}
                  sections={sections}
                  inheritsSections={inheritsSections}
                  mode="identity"
                />
              </FormDialog>
            </div>
          </section>
          <MediaUploadField
            entityType="branch"
            entityId={branch.id}
            label={`Logo profil ${branch.name}`}
            previewUrl={assetUrl(branch.logoPath)}
          />
          {!branch.logoPath && (
            <p className="-mt-4 text-sm text-muted-foreground">
              Belum ada logo khusus; halaman ini mengikuti logo dari Pengaturan
              Bersama.
            </p>
          )}
          <section className="rounded-2xl bg-card p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-serif text-2xl">Susunan bagian</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {inheritsSections
                    ? "Saat ini mengikuti Pengaturan Bersama. Simpan untuk membuat susunan khusus cabang."
                    : "Susunan dan bagian yang tampil khusus untuk cabang ini."}
                </p>
              </div>
              <FormDialog
                title={`Susunan ${branch.name}`}
                triggerLabel="Atur bagian"
              >
                <BranchPageForm
                  branch={branch}
                  sections={sections}
                  inheritsSections={inheritsSections}
                  mode="sections"
                />
              </FormDialog>
            </div>
            <ol className="mt-5 divide-y divide-border border-t border-border">
              {sections.map((section) => (
                <li
                  key={section.id}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <span className="font-medium">{section.label}</span>
                  <span className="text-muted-foreground">
                    {section.isActive ? "Tampil" : "Disembunyikan"}
                  </span>
                </li>
              ))}
            </ol>
          </section>
          <PageCampaigns rows={campaigns} branchId={branch.id} />
          <GalleryManager
            branchId={branch.id}
            items={gallery.flatMap((item) => {
              const imageUrl = assetUrl(item.imagePath);
              return imageUrl ? [{ ...item, imageUrl }] : [];
            })}
          />
          <BranchProductManager branchId={branch.id} products={products} />
          <FaqManager
            faqs={faqs}
            branchId={branch.id}
            inherits={inheritsFaqs}
          />
          <PageLinks rows={links} branchId={branch.id} />
        </div>
        <PagePreview pageId={branch.id} title={branch.name} />
      </div>
    </div>
  );
}
