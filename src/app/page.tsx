import Link from "next/link";
import { connection } from "next/server";

import { PublicImage } from "@/components/public/public-image";
import { loadBranchDirectory } from "@/modules/public-content/data";

export const runtime = "nodejs";

export default async function HomePage() {
  await connection();
  const directory = await loadBranchDirectory();

  return (
    <main className="kgj-public mx-auto min-h-dvh w-full max-w-3xl px-4 py-10 text-foreground sm:px-6 sm:py-16">
      <header className="flex items-center gap-4">
        {directory.logoUrl ? (
          <PublicImage
            src={directory.logoUrl}
            alt={`Logo ${directory.siteName}`}
            width={80}
            height={80}
            className="size-16 rounded-2xl object-contain"
            unoptimized={process.env.NEXT_PUBLIC_APP_ENV === "local"}
          />
        ) : (
          <span className="flex size-16 items-center justify-center rounded-2xl bg-[var(--kgj-dark)] font-serif text-2xl text-[var(--kgj-accent-soft)]">
            KJ
          </span>
        )}
        <p className="font-serif text-xl font-bold">{directory.siteName}</p>
      </header>

      <section aria-labelledby="branch-directory-title" className="mt-14">
        <p className="text-xs font-bold tracking-[0.18em] text-[var(--kgj-accent)] uppercase">
          Pilih lokasi
        </p>
        <h1
          id="branch-directory-title"
          className="mt-3 font-serif text-4xl leading-tight font-bold sm:text-5xl"
        >
          Temukan Link Bio cabang Anda
        </h1>
        <p className="mt-4 max-w-xl leading-7 text-muted-foreground">
          Pilih cabang untuk melihat produk, informasi, dan nomor WhatsApp yang
          sesuai dengan lokasi Anda.
        </p>

        {directory.branches.length ? (
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {directory.branches.map((branch) => (
              <li key={branch.slug}>
                <Link
                  href={`/${branch.slug}`}
                  className="group flex min-h-24 items-center justify-between gap-4 rounded-2xl bg-card px-6 py-5 transition-colors hover:bg-[var(--kgj-accent-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none"
                >
                  <span className="font-serif text-2xl font-bold">
                    {branch.name}
                  </span>
                  <span
                    aria-hidden="true"
                    className="text-2xl transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
                  >
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p role="status" className="mt-8 rounded-2xl bg-card p-6">
            Belum ada cabang aktif yang dapat ditampilkan.
          </p>
        )}
      </section>

      {directory.privacyUrl && (
        <footer className="mt-16 border-t border-border pt-6 text-sm">
          <a
            href={directory.privacyUrl}
            className="inline-flex min-h-11 items-center underline underline-offset-4"
          >
            Kebijakan privasi
          </a>
        </footer>
      )}
    </main>
  );
}
