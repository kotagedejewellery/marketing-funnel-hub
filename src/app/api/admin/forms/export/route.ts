import { getDatabase } from "@/lib/db/client";
import { auditLogs } from "@/lib/db/schema";
import { requireAdmin } from "@/modules/admin/access";
import { formSubmissionCsv } from "@/modules/form-submissions/csv";
import { decryptFormValues } from "@/modules/form-submissions/crypto";
import {
  getFormResponseExportRows,
  hasValidFormResponseFilters,
  parseFormResponseFilters,
} from "@/modules/form-submissions/management";
import { pageBuilderFormFieldSchema } from "@/modules/page-builder/schema";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const profile = await requireAdmin();
  const url = new URL(request.url);
  const query = Object.fromEntries(url.searchParams.entries());
  if (!hasValidFormResponseFilters(query))
    return Response.json(
      {
        ok: false,
        error: {
          code: "INVALID_FILTER",
          message: "Filter respons form tidak valid.",
        },
      },
      { status: 422 },
    );
  const filters = parseFormResponseFilters(query);
  const db = getDatabase();
  const rows = await getFormResponseExportRows(filters);
  const csv = formSubmissionCsv(
    rows.map((row) => {
      let values: Record<string, string | boolean> | null = null;
      try {
        values = decryptFormValues(row.valuesEncrypted);
      } catch {
        // The CSV marks undecryptable historical rows without losing the export.
      }
      return {
        id: row.id,
        submittedAt: row.submittedAt,
        whatsappContinuedAt: row.whatsappContinuedAt,
        branchName: row.branchName,
        formTitle: row.formTitle,
        productName: row.productName,
        fields:
          pageBuilderFormFieldSchema
            .array()
            .safeParse((row.formSchema as { fields?: unknown }).fields).data ??
          [],
        values,
      };
    }),
  );
  await db.insert(auditLogs).values({
    adminId: profile.id,
    action: "export",
    entityType: "form_submissions",
    entityId: filters.formId,
    changes: { ...filters, rowCount: rows.length },
  });
  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kgj-form-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
