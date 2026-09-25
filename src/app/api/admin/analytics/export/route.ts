import { auditLogs } from "@/lib/db/schema";
import { getDatabase } from "@/lib/db/client";
import { requireAdmin } from "@/modules/admin/access";
import { getTrackingExportRows } from "@/modules/admin/tracking/data";
import { parseTrackingAnalyticsFilters } from "@/modules/admin/tracking/validation";

export const runtime = "nodejs";

function csvCell(value: string | number | null | undefined) {
  const normalized = String(value ?? "").replace(/[\r\n]+/g, " ");
  return `"${normalized.replaceAll('"', '""')}"`;
}

function csv(rows: Awaited<ReturnType<typeof getTrackingExportRows>>) {
  const header = [
    "Event ID",
    "Waktu (UTC)",
    "Event",
    "Halaman",
    "Produk",
    "Cabang",
    "Tautan",
    "Jenis tautan",
    "CTA",
    "Sumber",
    "Kampanye",
    "UTM source",
    "UTM medium",
    "UTM campaign",
    "UTM content",
    "UTM term",
    "Perangkat",
    "Browser",
    "Negara",
    "Kota",
  ];
  return [
    header.map(csvCell).join(","),
    ...rows.map((row) =>
      [
        row.eventId,
        row.eventTime.toISOString(),
        row.eventName,
        row.pageUrl,
        row.productCategory,
        row.branchName,
        row.linkLabel,
        row.linkType,
        row.eventName === "Contact" ? "whatsapp" : row.eventName === "LinkClick" ? "link" : null,
        row.source,
        row.campaign,
        row.utmSource,
        row.utmMedium,
        row.utmCampaign,
        row.utmContent,
        row.utmTerm,
        row.deviceType,
        row.browserFamily,
        row.countryCode,
        row.city,
      ]
        .map(csvCell)
        .join(","),
    ),
  ].join("\r\n");
}

export async function GET(request: Request) {
  const profile = await requireAdmin();
  const url = new URL(request.url);
  const filters = parseTrackingAnalyticsFilters(
    Object.fromEntries(url.searchParams.entries()),
  );
  const rows = await getTrackingExportRows(filters);
  await getDatabase().insert(auditLogs).values({
    adminId: profile.id,
    action: "export",
    entityType: "analytics_events",
    changes: {
      rowCount: rows.length,
      range: filters.range,
      hasBranchFilter: Boolean(filters.branchId),
      hasEventFilter: Boolean(filters.eventName),
    },
  });
  const filename = `kgj-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(`\uFEFF${csv(rows)}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
