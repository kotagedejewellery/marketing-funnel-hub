import Link from "next/link";

import { CampaignForm } from "@/components/admin/campaign-form";
import { FormDialog } from "@/components/admin/form-dialog";
import { MediaUploadField } from "@/components/admin/media-upload-field";
import { serverEnv } from "@/lib/env/server";
import { getCampaign } from "@/modules/admin/campaigns/data";
import { publicAssetUrl } from "@/modules/public-content/links";

export default async function EditCampaignPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const campaign = await getCampaign((await params).id);
  const saved = (await searchParams).saved === "1";

  return (
    <div>
      <Link
        href="/admin/campaigns"
        className="inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Kembali ke kampanye
      </Link>
      <p className="mt-6 text-xs font-semibold tracking-[0.18em] text-[var(--kgj-accent)] uppercase">
        Promosi / Editor
      </p>
      <h1 className="mt-3 font-serif text-4xl sm:text-5xl">Edit kampanye</h1>
      <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
        Perbarui konten dan jadwal kampanye yang sudah ada.
      </p>
      {saved && (
        <p
          role="status"
          className="mt-5 border-l-2 border-[var(--kgj-accent)] bg-secondary px-4 py-3 text-sm"
        >
          Kampanye tersimpan.
        </p>
      )}
      <div className="mt-8">
        <FormDialog
          title={`Edit ${campaign.name}`}
          triggerLabel="Edit kampanye"
          primary
        >
          <CampaignForm campaign={campaign} />
        </FormDialog>
      </div>
      <div className="mt-8">
        <MediaUploadField
          entityType="campaign"
          entityId={campaign.id}
          label="Banner kampanye"
          previewUrl={publicAssetUrl(
            serverEnv.NEXT_PUBLIC_SUPABASE_URL,
            serverEnv.SUPABASE_PUBLIC_ASSET_BUCKET,
            campaign.bannerPath,
          )}
        />
      </div>
    </div>
  );
}
