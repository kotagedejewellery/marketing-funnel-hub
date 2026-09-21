import { SignOutButton } from "@/components/admin/sign-out-button";

export default function AdminDeniedPage() {
  return (
    <main className="kgj-admin flex min-h-dvh items-center justify-center px-5 py-12 text-foreground">
      <div className="w-full max-w-xl border border-border bg-card p-7 sm:p-10">
        <p className="text-xs font-semibold tracking-[0.18em] text-[var(--kgj-accent)] uppercase">
          Kotagede Jewellery / Admin CMS
        </p>
        <h1 className="mt-5 font-serif text-4xl leading-tight">
          Akses admin tidak tersedia
        </h1>
        <p className="mt-4 leading-7 text-muted-foreground">
          Akun ini tidak memiliki profil admin aktif. Hubungi pengelola untuk
          memastikan akses, atau keluar dan masuk dengan akun lain.
        </p>
        <div className="mt-8 border-t border-border pt-6">
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}
