import { count } from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";
import { events } from "@/lib/db/schema";
import { serverEnv } from "@/lib/env/server";
import { requireTechnicalAdmin } from "@/modules/admin/access";

export default async function DiagnosticsPage() {
  await requireTechnicalAdmin();
  const [result] = await getDatabase().select({ value: count() }).from(events);
  const rows = [
    ["Environment", serverEnv.NEXT_PUBLIC_APP_ENV],
    [
      "Tracking internal",
      serverEnv.NEXT_PUBLIC_APP_ENV === "local" ||
      serverEnv.TRACKING_ENABLED === "true"
        ? "Aktif"
        : "Nonaktif",
    ],
    ["Event internal", String(result?.value ?? 0)],
    [
      "Meta/GTM",
      serverEnv.NEXT_PUBLIC_APP_ENV === "production" &&
      serverEnv.TRACKING_ENABLED === "true"
        ? "Jalur kode aktif; verifikasi penyedia masih diperlukan"
        : "Tidak dikirim dari lokal",
    ],
  ];
  return (
    <div>
      <h1 className="font-serif text-4xl">Diagnostik teknis</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Ringkasan konfigurasi aplikasi tanpa menampilkan token atau kredensial.
        Status pengiriman penyedia tetap perlu diverifikasi di Meta Events
        Manager dan GTM/GA4.
      </p>
      <dl className="mt-8 divide-y divide-border border-y border-border">
        {rows.map(([label, value]) => (
          <div key={label} className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr]">
            <dt className="font-medium">{label}</dt>
            <dd className="text-muted-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
