import { redirect } from "next/navigation";

import { LoginForm } from "@/components/admin/login-form";
import { getAdminAccess } from "@/modules/admin/access";

export default async function AdminLoginPage() {
  const access = await getAdminAccess();
  if (access.status === "authorized") redirect("/admin");
  if (access.status === "denied") redirect("/admin/denied");

  return (
    <main className="kgj-admin grid min-h-dvh text-foreground lg:grid-cols-2">
      <section className="flex flex-col justify-between border-b border-border bg-secondary px-6 py-8 sm:px-10 lg:border-r lg:border-b-0 lg:px-16 lg:py-12">
        <p className="text-xs font-semibold tracking-[0.2em] text-[var(--kgj-accent)] uppercase">
          Kotagede Jewellery
        </p>
        <div className="hidden max-w-lg py-12 lg:block">
          <p className="text-xs font-semibold tracking-[0.2em] text-[var(--kgj-accent)] uppercase">
            Ruang kerja konten
          </p>
          <p className="mt-5 font-serif text-5xl leading-tight">
            Kelola cerita, produk, dan tujuan konsultasi dalam satu tempat.
          </p>
        </div>
        <p className="hidden text-sm text-muted-foreground lg:block">
          Akses khusus tim pengelola KGJ.
        </p>
      </section>
      <section className="flex items-center justify-center px-5 py-12 sm:px-10 lg:px-16">
        <div className="w-full max-w-md">
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--kgj-accent)] uppercase">
            Admin CMS
          </p>
          <h1 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">
            Selamat datang kembali.
          </h1>
          <p className="mt-4 leading-7 text-muted-foreground">
            Masuk menggunakan akun admin yang telah disiapkan oleh pengelola.
          </p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
