import Link from "next/link";
import type { ReactNode } from "react";

import type { TrackingAnalytics } from "@/modules/admin/tracking/data";

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

const numberFormatter = new Intl.NumberFormat("id-ID");
const percentFormatter = new Intl.NumberFormat("id-ID", {
  style: "percent",
  maximumFractionDigits: 1,
});

const inputClass =
  "mt-2 min-h-11 w-full border border-border bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--kgj-accent)]";

type QueryOverride = Partial<TrackingAnalytics["filters"]>;

function queryFor(
  filters: TrackingAnalytics["filters"],
  override: QueryOverride = {},
  includeDetailFilters = true,
) {
  const values = { ...filters, ...override };
  const params = new URLSearchParams();
  params.set("view", values.view);
  params.set("range", values.range);
  if (values.range === "custom") {
    if (values.start) params.set("start", values.start);
    if (values.end) params.set("end", values.end);
  }
  if (values.branchId) params.set("branchId", values.branchId);
  if (includeDetailFilters) {
    if (values.eventName) params.set("eventName", values.eventName);
    if (values.product) params.set("product", values.product);
    if (values.source) params.set("source", values.source);
    if (values.campaign) params.set("campaign", values.campaign);
    if (values.page > 1) params.set("page", String(values.page));
  }
  return `?${params.toString()}`;
}

function count(value: number) {
  return numberFormatter.format(value);
}

function percentage(value: number | null) {
  return value === null ? "—" : percentFormatter.format(value);
}

function periodChange(value: number, previous: number) {
  if (previous === 0) return value === 0 ? "Tidak berubah" : "Data baru";
  const delta = (value - previous) / previous;
  return `${delta > 0 ? "+" : ""}${percentFormatter.format(delta)} vs periode sebelumnya`;
}

export function TrackingAnalyticsDashboard({
  analytics,
}: {
  analytics: TrackingAnalytics;
}) {
  const overviewHref = queryFor(
    analytics.filters,
    { view: "overview", page: 1 },
    false,
  );
  const eventsHref = queryFor(
    analytics.filters,
    { view: "events", page: 1 },
    false,
  );

  return (
    <div>
      <header className="max-w-3xl">
        <h1 className="font-serif text-4xl sm:text-5xl">Analytics</h1>
        <p className="mt-3 leading-7 text-muted-foreground">
          Baca perjalanan pengunjung dari Link Bio hingga klik WhatsApp dengan
          data event internal yang tersimpan.
        </p>
      </header>

      <FilterBar analytics={analytics} />

      <nav
        aria-label="Tampilan Analytics"
        className="mt-8 flex border-b border-border"
      >
        <Link
          href={overviewHref}
          aria-current={
            analytics.filters.view === "overview" ? "page" : undefined
          }
          className={`min-h-11 px-4 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 ${analytics.filters.view === "overview" ? "border-b-2 border-[var(--kgj-accent)] text-[var(--kgj-dark)]" : "text-muted-foreground hover:text-[var(--kgj-dark)]"}`}
        >
          Ringkasan
        </Link>
        <Link
          href={eventsHref}
          aria-current={
            analytics.filters.view === "events" ? "page" : undefined
          }
          className={`min-h-11 px-4 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 ${analytics.filters.view === "events" ? "border-b-2 border-[var(--kgj-accent)] text-[var(--kgj-dark)]" : "text-muted-foreground hover:text-[var(--kgj-dark)]"}`}
        >
          Detail event
        </Link>
      </nav>

      {analytics.filters.view === "overview" ? (
        <Overview analytics={analytics} />
      ) : (
        <EventDetails analytics={analytics} />
      )}
    </div>
  );
}

function FilterBar({ analytics }: { analytics: TrackingAnalytics }) {
  return (
    <section className="mt-8 rounded-2xl bg-[var(--kgj-accent-soft)] p-5 sm:p-6">
      <form
        method="get"
        className="grid gap-4 lg:grid-cols-[minmax(11rem,0.7fr)_minmax(13rem,1fr)_minmax(10rem,0.7fr)_minmax(10rem,0.7fr)_auto] lg:items-end"
      >
        <input type="hidden" name="view" value={analytics.filters.view} />
        <div>
          <label htmlFor="analytics-range" className="text-sm font-semibold">
            Rentang waktu
          </label>
          <select
            id="analytics-range"
            name="range"
            defaultValue={analytics.filters.range}
            className={inputClass}
          >
            <option value="7">7 hari terakhir</option>
            <option value="30">30 hari terakhir</option>
            <option value="month">Bulan berjalan</option>
            <option value="custom">Rentang kustom</option>
          </select>
        </div>
        <div>
          <label htmlFor="analytics-branch" className="text-sm font-semibold">
            Cabang
          </label>
          <select
            id="analytics-branch"
            name="branchId"
            defaultValue={analytics.filters.branchId ?? ""}
            className={inputClass}
          >
            <option value="">Semua cabang</option>
            {analytics.branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="analytics-start" className="text-sm font-semibold">
            Dari
          </label>
          <input
            id="analytics-start"
            name="start"
            type="date"
            defaultValue={analytics.filters.start ?? analytics.range.startDate}
            max={analytics.range.endDate}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="analytics-end" className="text-sm font-semibold">
            Sampai
          </label>
          <input
            id="analytics-end"
            name="end"
            type="date"
            defaultValue={analytics.filters.end ?? analytics.range.endDate}
            max={analytics.range.endDate}
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          className="min-h-11 bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-[var(--kgj-accent)] focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Terapkan
        </button>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">
        {analytics.range.label} · {analytics.selectedBranch ?? "Semua cabang"} ·
        WIB
      </p>
    </section>
  );
}

function Overview({ analytics }: { analytics: TrackingAnalytics }) {
  const hasData =
    analytics.totals.PageView +
      analytics.totals.Contact +
      analytics.totals.LinkClick >
    0;

  return (
    <div className="mt-8 space-y-6">
      {!hasData && (
        <section className="rounded-2xl bg-card p-6 sm:p-8">
          <h2 className="font-serif text-2xl">
            Belum ada event pada rentang ini
          </h2>
          <p className="mt-2 max-w-2xl leading-6 text-muted-foreground">
            Data akan muncul setelah Link Bio menerima kunjungan dan sistem
            menyimpan event internal.
          </p>
        </section>
      )}
      <section className="grid gap-4 xl:grid-cols-[minmax(18rem,1.2fr)_repeat(3,minmax(0,1fr))]">
        <div className="rounded-2xl bg-[var(--kgj-dark)] p-6 text-[var(--primary-foreground)] sm:p-7">
          <p className="text-sm font-semibold text-[var(--kgj-on-dark-muted)]">
            Link Bio dibuka
          </p>
          <p className="mt-5 font-serif text-5xl font-bold tabular-nums">
            {count(analytics.totals.PageView)}
          </p>
          <p className="mt-4 text-sm leading-6 text-[var(--kgj-on-dark-muted)]">
            {periodChange(
              analytics.totals.PageView,
              analytics.previousTotals.PageView,
            )}
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--kgj-on-dark-muted)]">
            Setiap reload tercatat sebagai pembukaan baru.
          </p>
        </div>
        <Metric
          label="Klik WhatsApp"
          value={count(analytics.totals.Contact)}
          note={periodChange(
            analytics.totals.Contact,
            analytics.previousTotals.Contact,
          )}
        />
        <Metric
          label="Konversi WhatsApp"
          value={percentage(analytics.whatsappConversion)}
          note="Contact ÷ PageView"
          featured
        />
        <Metric
          label="Klik tautan"
          value={count(analytics.totals.LinkClick)}
          note={periodChange(
            analytics.totals.LinkClick,
            analytics.previousTotals.LinkClick,
          )}
        />
      </section>

      <section
        className="rounded-2xl bg-card p-6 sm:p-8"
        aria-labelledby="trend-heading"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="trend-heading" className="font-serif text-3xl">
              Tren perjalanan pengunjung
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Volume event harian; setiap warna tetap memakai event kanonis yang
              sama, termasuk klik tautan CMS.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-muted-foreground">
            <Legend color="bg-[var(--kgj-dark)]" label="PageView" />
            <Legend color="bg-[var(--kgj-accent-soft)]" label="Contact" />
            <Legend color="bg-secondary" label="LinkClick" />
          </div>
        </div>
        <TrendChart trend={analytics.trend} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(20rem,0.7fr)]">
        <PerformanceTable analytics={analytics} />
        <AttributionPanels analytics={analytics} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <TechnicalPanels analytics={analytics} />
        <ProviderPanels analytics={analytics} />
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  note,
  featured = false,
}: {
  label: string;
  value: string;
  note: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-6 sm:p-7 ${featured ? "bg-[var(--kgj-accent-soft)]" : "bg-card"}`}
    >
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <p className="mt-5 font-serif text-4xl font-bold tabular-nums">{value}</p>
      <p className="mt-4 text-sm text-muted-foreground">{note}</p>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden="true" className={`size-2.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function TrendChart({ trend }: { trend: TrackingAnalytics["trend"] }) {
  const maximum = Math.max(
    1,
    ...trend.flatMap((day) => [day.PageView, day.Contact, day.LinkClick]),
  );

  return (
    <div className="mt-8 overflow-x-auto pb-2">
      <div
        className="grid min-w-[40rem] grid-flow-col auto-cols-fr gap-2"
        role="img"
        aria-label="Grafik tren event harian"
      >
        {trend.map((day, index) => (
          <div
            key={day.day}
            className="grid min-w-8 grid-rows-[11rem_auto] gap-3"
          >
            <div className="flex items-end justify-center gap-1 border-b border-border px-1">
              <Bar
                value={day.PageView}
                maximum={maximum}
                color="bg-[var(--kgj-dark)]"
                label={`${day.label}: ${day.PageView} PageView`}
              />
              <Bar
                value={day.Contact}
                maximum={maximum}
                color="bg-[var(--kgj-accent-soft)]"
                label={`${day.label}: ${day.Contact} Contact`}
              />
              <Bar
                value={day.LinkClick}
                maximum={maximum}
                color="bg-secondary"
                label={`${day.label}: ${day.LinkClick} LinkClick`}
              />
            </div>
            <span className="text-center text-[0.68rem] text-muted-foreground">
              {index % Math.max(1, Math.ceil(trend.length / 6)) === 0
                ? day.label
                : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Bar({
  value,
  maximum,
  color,
  label,
}: {
  value: number;
  maximum: number;
  color: string;
  label: string;
}) {
  return (
    <span
      title={label}
      aria-label={label}
      className={`w-1.5 rounded-t-sm ${color}`}
      style={{ height: `${(value / maximum) * 100}%` }}
    />
  );
}

function PerformanceTable({ analytics }: { analytics: TrackingAnalytics }) {
  return (
    <section
      className="rounded-2xl bg-card p-6 sm:p-8"
      aria-labelledby="performance-heading"
    >
      <h2 id="performance-heading" className="font-serif text-3xl">
        Kinerja cabang &amp; produk
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Buka adalah total PageView, jadi reload dihitung lagi. Kunjungan halaman
        cabang ditentukan dari URL event; konteks produk dan Contact tetap
        berasal dari event kanonis.
      </p>
      <TableHeading columns={["Cabang", "Buka", "WhatsApp", "Konversi"]} />
      {analytics.branchPerformance.length === 0 ? (
        <EmptyTable copy="Belum ada kinerja cabang pada rentang ini." />
      ) : (
        <ul className="divide-y divide-border border-b border-border">
          {analytics.branchPerformance.map((branch) => (
            <li
              key={branch.id}
              className="grid grid-cols-[minmax(8rem,1.4fr)_repeat(3,minmax(3.75rem,0.6fr))] gap-3 py-4 text-sm tabular-nums"
            >
              <span className="min-w-0 break-words font-semibold">
                {branch.name}
              </span>
              <span>{count(branch.PageView)}</span>
              <span>{count(branch.Contact)}</span>
              <span>{percentage(branch.conversion)}</span>
            </li>
          ))}
        </ul>
      )}
      <h3 className="mt-8 text-lg font-bold">
        Produk dengan klik WhatsApp terbanyak
      </h3>
      <TableHeading columns={["Produk", "Klik WhatsApp"]} compact />
      {analytics.products.length === 0 ? (
        <EmptyTable copy="Belum ada klik WhatsApp produk pada rentang ini." />
      ) : (
        <ul className="divide-y divide-border border-b border-border">
          {analytics.products.map((product) => (
            <li
              key={product.name}
              className="grid grid-cols-[minmax(9rem,1fr)_7rem] gap-3 py-4 text-sm tabular-nums"
            >
              <span className="break-words font-semibold">{product.name}</span>
              <span>{count(product.Contact)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function TableHeading({
  columns,
  compact = false,
}: {
  columns: string[];
  compact?: boolean;
}) {
  return (
    <div
      className={`mt-6 grid gap-3 border-y border-border bg-secondary px-3 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase ${compact ? "grid-cols-[minmax(9rem,1fr)_7rem]" : "grid-cols-[minmax(8rem,1.4fr)_repeat(3,minmax(3.75rem,0.6fr))]"}`}
    >
      {columns.map((column) => (
        <span key={column}>{column}</span>
      ))}
    </div>
  );
}

function EmptyTable({ copy }: { copy: string }) {
  return (
    <p className="border-b border-border py-6 text-sm text-muted-foreground">
      {copy}
    </p>
  );
}

function AttributionPanels({ analytics }: { analytics: TrackingAnalytics }) {
  return (
    <div className="space-y-6">
      <Ranking
        title="Sumber kunjungan"
        description="Sesi kunjungan halaman dikelompokkan menurut utm_source. Tanpa UTM source berarti URL kunjungan tidak memuat parameter tersebut."
        rows={analytics.sources}
      />
      <Ranking
        title="Kampanye"
        description="Sesi kunjungan halaman dikelompokkan menurut utm_campaign. Tanpa UTM campaign berarti URL kunjungan tidak memuat parameter tersebut."
        rows={analytics.campaigns}
      />
    </div>
  );
}

function TechnicalPanels({ analytics }: { analytics: TrackingAnalytics }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <Ranking
        title="Perangkat"
        description="Satu sesi kunjungan halaman dihitung satu kali. Reload tidak menambah sesi."
        rows={analytics.devices}
      />
      <Ranking
        title="Browser"
        description="Satu sesi kunjungan halaman dihitung satu kali. Reload tidak menambah sesi."
        rows={analytics.browsers}
      />
      <Ranking
        title="Negara"
        description="Satu sesi kunjungan halaman dihitung satu kali. Negara berasal dari header deployment bila tersedia."
        rows={analytics.countries}
      />
      <Ranking
        title="Kota (minimum 5 event)"
        description="Ditampilkan hanya bila kategori kota memiliki sedikitnya lima event. Nilai tetap dihitung per sesi kunjungan halaman."
        rows={analytics.cities}
      />
    </div>
  );
}

function ProviderPanels({ analytics }: { analytics: TrackingAnalytics }) {
  const providers = [
    { name: "Meta Ads", report: analytics.providers.meta, required: 2 },
    {
      name: "Google Analytics 4",
      report: analytics.providers.ga4,
      required: 3,
    },
  ].filter(
    ({ report, required }) =>
      report.status !== "not_configured" || report.missing.length < required,
  );

  if (providers.length === 0) return null;

  return (
    <section className="rounded-2xl bg-card p-6 sm:p-8">
      <h2 className="font-serif text-3xl">Laporan iklan eksternal</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
        Data ini dibaca langsung saat halaman dibuka dan tidak dicampur dengan
        event internal. Meta Pixel dan CAPI tetap berjalan terpisah dari laporan
        ini. Tidak ada sinkronisasi terjadwal.
      </p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {providers.map(({ name, report }) => (
          <ProviderPanel key={name} name={name} report={report} />
        ))}
      </div>
    </section>
  );
}

function ProviderPanel({
  name,
  report,
}: {
  name: string;
  report: TrackingAnalytics["providers"]["meta"];
}) {
  if (report.status === "not_configured") {
    return (
      <div className="border border-border p-5">
        <h3 className="font-bold">{name}</h3>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {providerSetupMessage(name, report.missing)}
        </p>
      </div>
    );
  }
  if (report.status === "error") {
    return (
      <div className="border border-border p-5">
        <h3 className="font-bold">{name}</h3>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Data tidak dapat dibaca saat ini. Periksa akses akun dan kredensial.
        </p>
      </div>
    );
  }
  return (
    <div className="border border-border p-5">
      <h3 className="font-bold">{name}</h3>
      <dl className="mt-4 space-y-3 text-sm">
        {report.metrics.map((metric) => (
          <div key={metric.label} className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{metric.label}</dt>
            <dd className="font-semibold tabular-nums">
              {count(metric.value)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function providerSetupMessage(name: string, missing: string[]) {
  if (name === "Meta Ads") {
    if (missing.includes("meta_marketing_token")) {
      return "ID akun iklan tersedia, tetapi token Meta Marketing API belum tersedia di environment Production.";
    }
    return "ID akun iklan dan token Meta Marketing API belum tersedia di environment Production.";
  }
  return "Kredensial Google Analytics 4 belum lengkap di environment Production.";
}

function Ranking({
  title,
  description,
  rows,
}: {
  title: string;
  description: string;
  rows: { name: string; count: number }[];
}) {
  return (
    <section className="rounded-2xl bg-card p-6 sm:p-7">
      <h2 className="font-serif text-2xl">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {rows.length === 0 ? (
        <p className="mt-5 text-sm text-muted-foreground">
          Belum ada data pada rentang ini.
        </p>
      ) : (
        <ol className="mt-5 divide-y divide-border border-y border-border">
          {rows.slice(0, 6).map((row) => (
            <li
              key={row.name}
              className="flex items-center justify-between gap-4 py-3 text-sm"
            >
              <span className="min-w-0 break-words font-medium">
                {row.name}
              </span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {count(row.count)} sesi
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function EventDetails({ analytics }: { analytics: TrackingAnalytics }) {
  return (
    <section
      className="mt-8 rounded-2xl bg-card p-6 sm:p-8"
      aria-labelledby="event-list-heading"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="event-list-heading" className="font-serif text-3xl">
            Detail event
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Gunakan detail ini untuk memeriksa konteks event internal. Status di
            sini tidak membuktikan pengiriman ke Meta atau GA4.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Terbaru lebih dahulu · WIB
        </p>
      </div>
      <EventFilters analytics={analytics} />
      <a
        href={`/api/admin/analytics/export${queryFor(analytics.filters, { page: 1 })}`}
        className="mt-5 inline-flex min-h-11 items-center border border-border px-4 text-sm font-semibold hover:border-[var(--kgj-accent)] hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Export CSV (maks. 10.000 event)
      </a>
      {analytics.detailEvents.length === 0 ? (
        <div className="mt-6 border-y border-border py-8">
          <h3 className="font-serif text-2xl">Tidak ada event yang cocok</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Ubah filter atau pilih rentang waktu lain.
          </p>
        </div>
      ) : (
        <EventTable analytics={analytics} />
      )}
    </section>
  );
}

function EventFilters({ analytics }: { analytics: TrackingAnalytics }) {
  return (
    <form
      method="get"
      className="mt-6 grid gap-4 border-y border-border py-5 md:grid-cols-2 xl:grid-cols-4"
    >
      <input type="hidden" name="view" value="events" />
      <input type="hidden" name="range" value={analytics.filters.range} />
      {analytics.filters.range === "custom" && (
        <>
          <input
            type="hidden"
            name="start"
            value={analytics.filters.start ?? ""}
          />
          <input type="hidden" name="end" value={analytics.filters.end ?? ""} />
        </>
      )}
      <input
        type="hidden"
        name="branchId"
        value={analytics.filters.branchId ?? ""}
      />
      <FilterSelect
        name="eventName"
        label="Event"
        value={analytics.filters.eventName ?? ""}
        options={["PageView", "Contact", "LinkClick"]}
        allLabel="Semua event"
      />
      <FilterSelect
        name="product"
        label="Produk"
        value={analytics.filters.product ?? ""}
        options={analytics.detailOptions.products}
        allLabel="Semua produk"
      />
      <FilterSelect
        name="source"
        label="Sumber"
        value={analytics.filters.source ?? ""}
        options={analytics.detailOptions.sources}
        allLabel="Semua sumber"
      />
      <FilterSelect
        name="campaign"
        label="Kampanye"
        value={analytics.filters.campaign ?? ""}
        options={analytics.detailOptions.campaigns}
        allLabel="Semua kampanye"
      />
      <button
        type="submit"
        className="min-h-11 bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-[var(--kgj-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 md:col-span-2 xl:col-span-4"
      >
        Terapkan filter detail
      </button>
    </form>
  );
}

function FilterSelect({
  name,
  label,
  value,
  options,
  allLabel,
}: {
  name: string;
  label: string;
  value: string;
  options: string[];
  allLabel: string;
}) {
  return (
    <div>
      <label htmlFor={`detail-${name}`} className="text-sm font-semibold">
        {label}
      </label>
      <select
        id={`detail-${name}`}
        name={name}
        defaultValue={value}
        className={inputClass}
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function EventTable({ analytics }: { analytics: TrackingAnalytics }) {
  const previousHref = queryFor(analytics.filters, {
    page: analytics.detailPage - 1,
  });
  const nextHref = queryFor(analytics.filters, {
    page: analytics.detailPage + 1,
  });
  return (
    <>
      <div className="mt-6 border border-border">
        <div className="hidden grid-cols-[minmax(8rem,0.85fr)_minmax(8rem,0.8fr)_minmax(8rem,0.95fr)_minmax(12rem,1.4fr)] gap-5 border-b border-border bg-secondary px-6 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase lg:grid">
          <span>Event / ID</span>
          <span>Waktu</span>
          <span>Produk / cabang</span>
          <span>Attribution iklan</span>
        </div>
        <ul className="divide-y divide-border">
          {analytics.detailEvents.map((event) => (
            <li
              key={event.id}
              className="grid gap-4 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(8rem,0.85fr)_minmax(8rem,0.8fr)_minmax(8rem,0.95fr)_minmax(12rem,1.4fr)] lg:gap-5"
            >
              <div className="min-w-0">
                <p className="font-semibold">{event.eventName}</p>
                <p className="mt-1 break-all text-xs text-muted-foreground">
                  ID: {event.eventId}
                </p>
              </div>
              <DetailCell label="Waktu">
                <time
                  dateTime={event.eventTime.toISOString()}
                  className="text-sm tabular-nums"
                >
                  {dateTimeFormatter.format(event.eventTime)} WIB
                </time>
              </DetailCell>
              <DetailCell label="Produk / cabang">
                <p className="break-words font-medium">
                  {event.productCategory ?? event.linkLabel ?? "—"}
                </p>
                <p className="mt-1 break-words text-muted-foreground">
                  {event.branchName ?? event.linkType ?? "—"}
                </p>
              </DetailCell>
              <DetailCell label="Attribution iklan">
                <p className="break-words font-medium">
                  {event.source ?? event.utmSource ?? "Tidak diketahui"}
                </p>
                <p className="mt-1 break-words text-muted-foreground">
                  Campaign:{" "}
                  {event.campaign ?? event.utmCampaign ?? "Tidak diketahui"}
                </p>
                {(event.utmContent || event.utmTerm) && (
                  <dl className="mt-3 space-y-1 text-xs text-muted-foreground">
                    {event.utmContent && (
                      <div className="flex gap-2">
                        <dt className="shrink-0 font-semibold text-foreground">
                          Ad Set
                        </dt>
                        <dd className="min-w-0 break-words">
                          {event.utmContent}
                        </dd>
                      </div>
                    )}
                    {event.utmTerm && (
                      <div className="flex gap-2">
                        <dt className="shrink-0 font-semibold text-foreground">
                          Ad
                        </dt>
                        <dd className="min-w-0 break-words">{event.utmTerm}</dd>
                      </div>
                    )}
                  </dl>
                )}
              </DetailCell>
            </li>
          ))}
        </ul>
      </div>
      {analytics.detailPageCount > 1 && (
        <nav
          aria-label="Halaman detail event"
          className="mt-6 flex flex-wrap items-center gap-3 text-sm"
        >
          {analytics.detailPage > 1 && (
            <Link
              href={previousHref}
              className="inline-flex min-h-11 items-center border border-border px-4 font-semibold hover:border-[var(--kgj-accent)] hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Sebelumnya
            </Link>
          )}
          <span className="tabular-nums text-muted-foreground">
            Halaman {analytics.detailPage} dari {analytics.detailPageCount}
          </span>
          {analytics.detailPage < analytics.detailPageCount && (
            <Link
              href={nextHref}
              className="inline-flex min-h-11 items-center border border-border px-4 font-semibold hover:border-[var(--kgj-accent)] hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Berikutnya
            </Link>
          )}
        </nav>
      )}
    </>
  );
}

function DetailCell({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 text-sm">
      <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase lg:hidden">
        {label}
      </p>
      {children}
    </div>
  );
}
