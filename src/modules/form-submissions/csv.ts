import type { PageBuilderFormField } from "@/modules/page-builder/schema";

type SubmissionCsvRow = {
  id: string;
  submittedAt: Date;
  branchName: string;
  formTitle: string;
  productName: string;
  fields: PageBuilderFormField[];
  values: Record<string, string | boolean> | null;
};

function csvCell(value: string | boolean | null | undefined) {
  const normalized = String(value ?? "").replace(/[\r\n]+/g, " ");
  const safe = /^[=+\-@]/.test(normalized) ? `'${normalized}` : normalized;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function formSubmissionCsv(rows: SubmissionCsvRow[]) {
  const fields = [
    ...rows
      .flatMap((row) => row.fields)
      .reduce(
        (all, field) => all.set(`${field.id}:${field.label}`, field),
        new Map<string, PageBuilderFormField>(),
      )
      .values(),
  ];
  const header = [
    "ID Respons",
    "Waktu (UTC)",
    "Cabang",
    "Form",
    "CTA WhatsApp",
    "Status respons",
    ...fields.map((field) => field.label),
  ];
  return [
    header.map(csvCell).join(","),
    ...rows.map((row) =>
      [
        row.id,
        row.submittedAt.toISOString(),
        row.branchName,
        row.formTitle,
        row.productName,
        row.values ? "Tersimpan" : "Tidak dapat didekripsi",
        ...fields.map((field) => {
          const historicalField = row.fields.find(
            (item) => item.id === field.id && item.label === field.label,
          );
          return historicalField
            ? row.values?.[historicalField.name]
            : undefined;
        }),
      ]
        .map(csvCell)
        .join(","),
    ),
  ].join("\r\n");
}
