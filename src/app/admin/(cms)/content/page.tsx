import Link from "next/link";

import { SectionList } from "@/components/admin/section-list";
import { getContentSettings } from "@/modules/admin/content/data";

export default async function ContentPage() {
  const { sections } = await getContentSettings();

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--kgj-accent)] uppercase">
            Tampilan publik
          </p>
          <h1 className="mt-3 font-serif text-4xl sm:text-5xl">
            Konten halaman
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
            Atur urutan dan visibilitas bagian Link Bio. Teks utama dikelola di
            Pengaturan.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center border-b border-foreground text-sm font-semibold hover:text-[var(--kgj-accent)] focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          Lihat halaman publik{" "}
          <span aria-hidden="true" className="ml-3">
            ↗
          </span>
        </Link>
      </div>
      <SectionList sections={sections} />
    </div>
  );
}
