"use client";

import { useEffect, useState } from "react";

export function PagePreview({
  pageId,
  title,
}: {
  pageId: string;
  title: string;
}) {
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const refresh = () => setRevision(Date.now());
    window.addEventListener("kgj:admin-saved", refresh);
    return () => window.removeEventListener("kgj:admin-saved", refresh);
  }, []);

  const previewPath = `/admin/preview/link-bio/${pageId}?revision=${revision}`;

  return (
    <section
      className="rounded-2xl bg-card p-5 xl:sticky xl:top-6 xl:self-start"
      aria-label={`Pratinjau ${title}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl">Pratinjau</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Versi tersimpan · tanpa tracking
          </p>
        </div>
        <a
          href={previewPath}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Buka lebih besar
        </a>
      </div>
      <div className="mx-auto mt-5 w-full max-w-[390px] overflow-hidden rounded-[1.75rem] border-8 border-[var(--kgj-dark)] bg-background shadow-[0_20px_45px_-32px_rgba(40,33,28,0.7)]">
        <iframe
          key={revision}
          title={`Pratinjau Link Bio ${title}`}
          src={previewPath}
          className="h-[min(70dvh,720px)] w-full bg-background"
        />
      </div>
    </section>
  );
}
