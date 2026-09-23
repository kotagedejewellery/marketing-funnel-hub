import Link from "next/link";

import { getAdminDashboard } from "@/modules/admin/dashboard";

const actionLabels: Record<string, string> = {
  create: "Dibuat",
  update: "Diperbarui",
  activate: "Diaktifkan",
  deactivate: "Dinonaktifkan",
  assign: "Ditambahkan",
  unassign: "Dilepas",
};

const entityLabels: Record<string, string> = {
  site_settings: "Pengaturan situs",
  content_sections: "Konten halaman",
  campaigns: "Kampanye",
  products: "Produk",
  branches: "Cabang",
  product_branches: "Cabang produk",
  links: "Tautan",
  admin_profiles: "Profil admin",
};

export default async function AdminDashboardPage() {
  const dashboard = await getAdminDashboard();

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="font-serif text-4xl font-bold leading-tight sm:text-5xl">
            Dashboard
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
            Kelola Link Bio tiap cabang dari satu CMS. Alamat utama hanya
            membantu pengunjung memilih cabang.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/admin/link-bio"
            className="inline-flex min-h-11 items-center rounded-full bg-[var(--kgj-dark)] px-5 text-sm font-bold text-[var(--primary-foreground)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none"
          >
            Kelola halaman Link Bio
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Lihat daftar cabang publik
          </Link>
        </div>
      </div>

      <section
        aria-label="Ringkasan konten"
        className="mt-8 grid gap-4 md:grid-cols-6"
      >
        <Summary
          href="/admin/settings"
          label="Identitas situs"
          value={dashboard.siteName ?? "Belum diatur"}
          action="Kelola pengaturan"
          className="bg-[var(--kgj-dark)] text-[var(--primary-foreground)] md:col-span-6"
          dark
        />
        <Summary
          href="/admin/link-bio"
          label="Cabang aktif"
          value={String(dashboard.activeBranches)}
          action="Pilih halaman cabang"
          className="bg-card md:col-span-3"
          numeric
        />
        <Summary
          href="/admin/products"
          label="Produk pustaka aktif"
          value={String(dashboard.activeProducts)}
          action="Kelola Pustaka Produk"
          className="bg-card md:col-span-3"
          numeric
        />
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(16rem,0.8fr)]">
        <section
          aria-labelledby="recent-changes"
          className="min-w-0 rounded-2xl bg-card p-6 sm:p-8"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="recent-changes" className="font-serif text-3xl font-bold">
                Perubahan terbaru
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Lima perubahan terakhir
            </p>
          </div>
          {dashboard.recentChanges.length === 0 ? (
            <p className="mt-5 border-t border-border py-8 text-muted-foreground">
              Belum ada perubahan tercatat. Aktivitas pengelolaan akan muncul di
              sini.
            </p>
          ) : (
            <ul className="mt-5 divide-y divide-border border-t border-border">
              {dashboard.recentChanges.map((change) => (
                <li
                  key={change.id}
                  className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-4 text-sm"
                >
                  <span className="font-medium">
                    {actionLabels[change.action] ?? "Perubahan"} ·{" "}
                    {entityLabels[change.entityType] ?? "Data lain"}
                  </span>
                  <time
                    dateTime={change.createdAt.toISOString()}
                    className="text-muted-foreground"
                  >
                    {new Intl.DateTimeFormat("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "Asia/Jakarta",
                    }).format(change.createdAt)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside
          className="rounded-2xl bg-[var(--kgj-accent-soft)] p-6 sm:p-8"
          aria-labelledby="quick-links"
        >
          <h2 id="quick-links" className="font-serif text-2xl font-bold">
            Akses cepat
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Pilih halaman yang ingin Anda ubah.
          </p>
          <div className="mt-5 grid gap-1">
            <QuickLink href="/admin/link-bio" label="Pilih halaman Link Bio" />
            <QuickLink href="/admin/settings" label="Pengaturan Bersama" />
            <QuickLink href="/admin/products" label="Kelola Pustaka Produk" />
            <QuickLink href="/admin/tracking" label="Validasi tracking" />
          </div>
        </aside>
      </div>
    </div>
  );
}

function Summary({
  href,
  label,
  value,
  action,
  className,
  dark = false,
  numeric = false,
}: {
  href: string;
  label: string;
  value: string;
  action: string;
  className: string;
  dark?: boolean;
  numeric?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex min-h-44 min-w-0 flex-col justify-between rounded-2xl p-6 transition-transform hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none sm:p-7 ${className}`}
    >
      <div>
        <p
          className={`text-sm font-semibold ${dark ? "text-[var(--kgj-on-dark-muted)]" : "text-muted-foreground"}`}
        >
          {label}
        </p>
        <p
          className={`mt-4 break-words font-serif font-bold leading-tight ${numeric ? "text-5xl tabular-nums" : "text-2xl sm:text-3xl"}`}
        >
          {value}
        </p>
      </div>
      <p
        className={`mt-6 text-sm font-bold group-hover:underline ${dark ? "text-[var(--kgj-accent-soft)]" : "text-[var(--kgj-accent)]"}`}
      >
        {action}
      </p>
    </Link>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex min-h-11 items-center justify-between gap-3 border-b border-border text-sm font-medium hover:text-[var(--kgj-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--kgj-accent)]"
    >
      {label}
    </Link>
  );
}
