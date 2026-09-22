import { FormDialog } from "@/components/admin/form-dialog";
import { SiteSettingsForm } from "@/components/admin/site-settings-form";
import { MediaUploadField } from "@/components/admin/media-upload-field";
import { serverEnv } from "@/lib/env/server";
import { getContentSettings } from "@/modules/admin/content/data";
import { publicAssetUrl } from "@/modules/public-content/links";

export default async function SettingsPage() {
  const { settings } = await getContentSettings();

  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.18em] text-[var(--kgj-accent)] uppercase">
        Identitas & pesan
      </p>
      <h1 className="mt-3 font-serif text-4xl sm:text-5xl">
        Pengaturan situs &amp; default
      </h1>
      <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
        Identitas halaman gabungan dan nilai bawaan untuk cabang yang belum
        mengatur identitas atau pesan WhatsApp sendiri.
      </p>
      <div className="mt-8 grid gap-4 xl:grid-cols-2">
        <section
          className="rounded-2xl bg-card p-6 sm:p-8"
          aria-labelledby="settings-summary"
        >
          <h2 id="settings-summary" className="font-serif text-2xl font-bold">
            Identitas halaman
          </h2>
          <p className="mt-4 text-sm font-semibold text-muted-foreground">
            Nama situs
          </p>
          <p className="mt-1 break-words text-xl font-bold">
            {settings.siteName}
          </p>
          <p className="mt-5 text-sm font-semibold text-muted-foreground">
            Headline
          </p>
          <p className="mt-1 break-words">
            {settings.headline || "Belum diisi"}
          </p>
          <p className="mt-5 text-sm font-semibold text-muted-foreground">
            CTA standar
          </p>
          <p className="mt-1 break-words">{settings.defaultCtaLabel}</p>
          <div className="mt-8">
            <FormDialog
              title="Edit pengaturan"
              triggerLabel="Edit pengaturan"
              primary
            >
              <SiteSettingsForm settings={settings} />
            </FormDialog>
          </div>
        </section>
        <MediaUploadField
          entityType="site"
          entityId={settings.id}
          label="Logo"
          previewUrl={publicAssetUrl(
            serverEnv.NEXT_PUBLIC_SUPABASE_URL,
            serverEnv.SUPABASE_PUBLIC_ASSET_BUCKET,
            settings.logoPath,
          )}
        />
      </div>
    </div>
  );
}
