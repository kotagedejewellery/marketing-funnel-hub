import Link from "next/link";

import { getTrackingValidationList } from "@/modules/admin/tracking/data";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

export default async function TrackingValidationPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const requestedPage = Number((await searchParams).page ?? 1);
  const { rows, page, pageCount } =
    await getTrackingValidationList(requestedPage);

  return (
    <div>
      <header>
        <p className="text-xs font-semibold tracking-[0.18em] text-[var(--kgj-accent)] uppercase">
          Pemeriksaan operasional
        </p>
        <h1 className="mt-3 font-serif text-4xl sm:text-5xl">
          Validasi tracking
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
          Telusuri event yang tersimpan untuk memastikan konteks produk, cabang,
          dan kampanye terbaca dengan benar.
        </p>
      </header>

      <p className="mt-8 border-l-2 border-[var(--kgj-accent)] bg-secondary px-5 py-4 text-sm leading-6">
        Halaman ini hanya menampilkan event internal. Keberadaan event di sini
        tidak membuktikan pengiriman ke Meta atau GA4.
      </p>

      <section aria-labelledby="event-list-heading" className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-[var(--kgj-accent)] uppercase">
              Data internal
            </p>
            <h2 id="event-list-heading" className="mt-2 font-serif text-3xl">
              Riwayat event
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Terbaru lebih dahulu · Waktu Jakarta (WIB)
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="mt-5 border border-border bg-card px-6 py-10">
            <h3 className="font-serif text-2xl">Belum ada event internal</h3>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Event akan muncul di sini setelah berhasil disimpan oleh sistem.
            </p>
          </div>
        ) : (
          <div className="mt-5 border border-border bg-card">
            <div className="hidden grid-cols-[minmax(9rem,1.05fr)_minmax(9rem,1fr)_minmax(9rem,1.15fr)_minmax(9rem,1.15fr)] gap-5 border-b border-border bg-secondary px-6 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase lg:grid">
              <span>Event / ID</span>
              <span>Waktu</span>
              <span>Produk / cabang</span>
              <span>Sumber / kampanye</span>
            </div>
            <ul className="divide-y divide-border">
              {rows.map((event) => (
                <li
                  key={event.id}
                  className="grid gap-4 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(9rem,1.05fr)_minmax(9rem,1fr)_minmax(9rem,1.15fr)_minmax(9rem,1.15fr)] lg:gap-5"
                >
                  <div className="min-w-0">
                    <p className="font-semibold">{event.eventName}</p>
                    <p className="mt-1 break-all text-xs text-muted-foreground">
                      ID: {event.eventId}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase lg:hidden">
                      Waktu
                    </p>
                    <time
                      dateTime={event.eventTime.toISOString()}
                      className="text-sm tabular-nums"
                    >
                      {dateFormatter.format(event.eventTime)} WIB
                    </time>
                  </div>
                  <div className="min-w-0 text-sm">
                    <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase lg:hidden">
                      Produk / cabang
                    </p>
                    <p className="break-words font-medium">
                      {event.productCategory ?? "—"}
                    </p>
                    <p className="mt-1 break-words text-muted-foreground">
                      {event.branchName ?? "—"}
                    </p>
                  </div>
                  <div className="min-w-0 text-sm">
                    <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase lg:hidden">
                      Sumber / kampanye
                    </p>
                    <p className="break-words font-medium">
                      {event.source ?? event.utmSource ?? "—"}
                    </p>
                    <p className="mt-1 break-words text-muted-foreground">
                      {event.campaign ?? event.utmCampaign ?? "—"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {pageCount > 1 && (
        <nav
          aria-label="Halaman validasi tracking"
          className="mt-6 flex flex-wrap items-center gap-3 text-sm"
        >
          {page > 1 && (
            <Link
              href={`/admin/tracking?page=${page - 1}`}
              className="inline-flex min-h-11 items-center border border-border px-4 font-semibold hover:border-[var(--kgj-accent)] hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Sebelumnya
            </Link>
          )}
          <span className="tabular-nums text-muted-foreground">
            Halaman {page} dari {pageCount}
          </span>
          {page < pageCount && (
            <Link
              href={`/admin/tracking?page=${page + 1}`}
              className="inline-flex min-h-11 items-center border border-border px-4 font-semibold hover:border-[var(--kgj-accent)] hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Berikutnya
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
