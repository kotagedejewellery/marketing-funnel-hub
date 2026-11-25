import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  isNotNull,
  isNull,
  lt,
  or,
  type SQL,
} from "drizzle-orm";
import * as z from "zod";

import { getDatabase } from "@/lib/db/client";
import {
  auditLogs,
  branches,
  branchPageBuilderLayouts,
  formSubmissionDeliveries,
  formSubmissions,
  productBranches,
  products,
} from "@/lib/db/schema";
import { requireAdmin } from "@/modules/admin/access";
import {
  pageBuilderBlocksSchema,
  pageBuilderFormFieldSchema,
} from "@/modules/page-builder/schema";

import {
  decryptFormValues,
  encryptFormValues,
  hashFormContactForSearch,
} from "./crypto";
import { isGoogleSheetsDeliveryRetryable } from "./delivery-state";

const pageSize = 50;
const identityBackfillBatchSize = 100;
const dateSchema = z.string().refine((value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}, "Tanggal tidak valid.");
const searchSchema = z
  .object({
    branchId: z.union([z.uuid(), z.literal("")]).optional(),
    formId: z.union([z.uuid(), z.literal("")]).optional(),
    productBranchId: z.union([z.uuid(), z.literal("")]).optional(),
    start: z.union([dateSchema, z.literal("")]).optional(),
    end: z.union([dateSchema, z.literal("")]).optional(),
    whatsappStatus: z
      .union([z.enum(["continued", "pending"]), z.literal("")])
      .optional(),
    cursor: z.string().min(1).max(256).optional(),
    page: z.coerce.number().int().positive().max(10_000).optional(),
  })
  .superRefine((value, context) => {
    if (value.start && value.end && value.start > value.end)
      context.addIssue({
        code: "custom",
        message: "Rentang tanggal tidak valid.",
      });
  });

export type FormResponseFilters = {
  branchId: string | null;
  formId: string | null;
  productBranchId: string | null;
  start: string | null;
  end: string | null;
  whatsappStatus: "continued" | "pending" | null;
  cursor: string | null;
  page: number;
};

type ResponseCursor = { submittedAt: Date; id: string };

function parseCursor(value: string | null): ResponseCursor | null {
  if (!value) return null;
  try {
    const [submittedAt, id] = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as [unknown, unknown];
    const date = new Date(String(submittedAt));
    if (!z.uuid().safeParse(id).success || Number.isNaN(date.getTime()))
      return null;
    return { submittedAt: date, id: String(id) };
  } catch {
    return null;
  }
}

function responseCursor(row: { submittedAt: Date; id: string }) {
  return Buffer.from(
    JSON.stringify([row.submittedAt.toISOString(), row.id]),
  ).toString("base64url");
}

type QueryInput = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function filterInput(input: QueryInput) {
  return {
    branchId: firstValue(input.branchId),
    formId: firstValue(input.formId),
    productBranchId: firstValue(input.productBranchId),
    start: firstValue(input.start),
    end: firstValue(input.end),
    whatsappStatus: firstValue(input.whatsappStatus),
    cursor: firstValue(input.cursor),
    page: firstValue(input.page),
  };
}

export function hasValidFormResponseFilters(input: QueryInput) {
  return searchSchema.safeParse(filterInput(input)).success;
}

export function parseFormResponseFilters(
  input: QueryInput,
): FormResponseFilters {
  const parsed = searchSchema.safeParse(filterInput(input));
  const value = parsed.success ? parsed.data : searchSchema.parse({});
  return {
    branchId: value.branchId || null,
    formId: value.formId || null,
    productBranchId: value.productBranchId || null,
    start: value.start || null,
    end: value.end || null,
    whatsappStatus: value.whatsappStatus || null,
    cursor: value.cursor || null,
    page: 1,
  };
}

function jakartaStart(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day - 1, 17));
}

function identitySummary(value: string | null) {
  if (!value) return null;
  try {
    const summary = decryptFormValues(value);
    const name = typeof summary.name === "string" ? summary.name.trim() : "";
    const contact =
      typeof summary.contact === "string" ? summary.contact.trim() : "";
    return { name: name || null, contact: maskContact(contact) };
  } catch {
    return null;
  }
}

function maskContact(value: string) {
  if (!value) return null;
  const [local, domain] = value.split("@");
  if (domain) return `${local.slice(0, 2)}••@${domain}`;
  if (value.length <= 4) return "••••";
  return `${value.slice(0, 3)}••••${value.slice(-4)}`;
}

function conditions(filters: FormResponseFilters) {
  const result: SQL[] = [];
  if (filters.branchId)
    result.push(eq(formSubmissions.branchId, filters.branchId));
  if (filters.formId)
    result.push(eq(formSubmissions.formBlockId, filters.formId));
  if (filters.productBranchId)
    result.push(eq(formSubmissions.productBranchId, filters.productBranchId));
  if (filters.start)
    result.push(gte(formSubmissions.submittedAt, jakartaStart(filters.start)));
  if (filters.end) {
    const end = jakartaStart(filters.end);
    end.setUTCDate(end.getUTCDate() + 1);
    result.push(lt(formSubmissions.submittedAt, end));
  }
  if (filters.whatsappStatus === "continued")
    result.push(isNotNull(formSubmissions.whatsappContinuedAt));
  if (filters.whatsappStatus === "pending")
    result.push(isNull(formSubmissions.whatsappContinuedAt));
  return result;
}

async function responseRows(
  filters: FormResponseFilters,
  limit: number,
  contactSearchHash?: string,
) {
  const cursor = parseCursor(filters.cursor);
  const where = and(
    ...conditions(filters),
    ...(contactSearchHash
      ? [eq(formSubmissions.contactSearchHash, contactSearchHash)]
      : []),
    ...(cursor
      ? [
          or(
            lt(formSubmissions.submittedAt, cursor.submittedAt),
            and(
              eq(formSubmissions.submittedAt, cursor.submittedAt),
              lt(formSubmissions.id, cursor.id),
            ),
          ),
        ]
      : []),
  );
  return getDatabase()
    .select({
      id: formSubmissions.id,
      submittedAt: formSubmissions.submittedAt,
      whatsappContinuedAt: formSubmissions.whatsappContinuedAt,
      formTitle: formSubmissions.formTitle,
      formBlockId: formSubmissions.formBlockId,
      identitySummaryEncrypted: formSubmissions.identitySummaryEncrypted,
      googleSheetsStatus: formSubmissionDeliveries.status,
      googleSheetsErrorCode: formSubmissionDeliveries.errorCode,
      googleSheetsLastAttemptAt: formSubmissionDeliveries.lastAttemptAt,
      branchId: branches.id,
      branchName: branches.name,
      productBranchId: productBranches.id,
      productName: products.name,
    })
    .from(formSubmissions)
    .innerJoin(branches, eq(formSubmissions.branchId, branches.id))
    .innerJoin(
      productBranches,
      eq(formSubmissions.productBranchId, productBranches.id),
    )
    .innerJoin(products, eq(productBranches.productId, products.id))
    .leftJoin(
      formSubmissionDeliveries,
      and(
        eq(formSubmissionDeliveries.submissionId, formSubmissions.id),
        eq(formSubmissionDeliveries.provider, "google_sheets"),
      ),
    )
    .where(where)
    .orderBy(desc(formSubmissions.submittedAt), desc(formSubmissions.id))
    .limit(limit + 1);
}

function responseRowWithIdentity(
  row: Awaited<ReturnType<typeof responseRows>>[number],
  identityConfiguration?: "needs_setup" | "needs_publish" | "ready",
) {
  const { identitySummaryEncrypted, googleSheetsLastAttemptAt, ...metadata } =
    row;
  return {
    ...metadata,
    hasIdentitySummary: identitySummaryEncrypted !== null,
    identity: identitySummary(identitySummaryEncrypted),
    identityConfiguration,
    googleSheetsRetryable: isGoogleSheetsDeliveryRetryable(
      metadata.googleSheetsStatus,
      googleSheetsLastAttemptAt,
    ),
  };
}

function hasConfiguredResponseIdentity(blocks: unknown, formBlockId: string) {
  const parsed = pageBuilderBlocksSchema.safeParse(blocks);
  if (!parsed.success) return false;
  const form = parsed.data.find(
    (block): block is Extract<(typeof parsed.data)[number], { type: "form" }> =>
      block.type === "form" && block.id === formBlockId,
  );
  return Boolean(
    form?.responseIdentity?.nameField || form?.responseIdentity?.contactField,
  );
}

export async function searchFormResponsesByContact(contact: string) {
  await requireAdmin();
  const contactSearchHash = hashFormContactForSearch(contact);
  if (!contactSearchHash) return [];
  return (
    await responseRows(
      parseFormResponseFilters({}),
      pageSize,
      contactSearchHash,
    )
  ).map((row) => responseRowWithIdentity(row));
}

export async function getFormResponseManagement(filters: FormResponseFilters) {
  await requireAdmin();
  const db = getDatabase();
  const where = and(...conditions(filters));
  const summaryFilters = { ...filters, whatsappStatus: null };
  const summaryWhere = and(...conditions(summaryFilters));
  const [
    totalRow,
    summaryTotalRow,
    continuedRow,
    branchRows,
    formRows,
    productRows,
  ] = await Promise.all([
    db.select({ value: count() }).from(formSubmissions).where(where),
    db.select({ value: count() }).from(formSubmissions).where(summaryWhere),
    db
      .select({ value: count() })
      .from(formSubmissions)
      .where(and(summaryWhere, isNotNull(formSubmissions.whatsappContinuedAt))),
    db
      .select({ id: branches.id, name: branches.name })
      .from(branches)
      .orderBy(asc(branches.name)),
    db
      .selectDistinctOn([formSubmissions.formBlockId], {
        id: formSubmissions.formBlockId,
        title: formSubmissions.formTitle,
      })
      .from(formSubmissions)
      .orderBy(
        asc(formSubmissions.formBlockId),
        desc(formSubmissions.submittedAt),
      ),
    db
      .select({
        id: productBranches.id,
        productName: products.name,
        branchName: branches.name,
      })
      .from(productBranches)
      .innerJoin(products, eq(productBranches.productId, products.id))
      .innerJoin(branches, eq(productBranches.branchId, branches.id))
      .orderBy(asc(products.name), asc(branches.name)),
  ]);
  const total = totalRow[0]?.value ?? 0;
  const rawRows = await responseRows(filters, pageSize);
  const pageRows = rawRows.slice(0, pageSize);
  const branchIds = [...new Set(pageRows.map((row) => row.branchId))];
  const layoutRows = branchIds.length
    ? await db
        .select({
          branchId: branchPageBuilderLayouts.branchId,
          draftBlocks: branchPageBuilderLayouts.draftBlocks,
          publishedBlocks: branchPageBuilderLayouts.publishedBlocks,
        })
        .from(branchPageBuilderLayouts)
        .where(inArray(branchPageBuilderLayouts.branchId, branchIds))
    : [];
  const layoutsByBranch = new Map(
    layoutRows.map((layout) => [layout.branchId, layout]),
  );
  const rows = pageRows.map((row) => {
    const layout = layoutsByBranch.get(row.branchId);
    const identityConfiguration = hasConfiguredResponseIdentity(
      layout?.publishedBlocks,
      row.formBlockId,
    )
      ? "ready"
      : hasConfiguredResponseIdentity(layout?.draftBlocks, row.formBlockId)
        ? "needs_publish"
        : "needs_setup";
    return responseRowWithIdentity(row, identityConfiguration);
  });
  return {
    filters,
    total,
    summary: {
      submitted: Number(summaryTotalRow[0]?.value ?? 0),
      continued: Number(continuedRow[0]?.value ?? 0),
    },
    nextCursor:
      rawRows.length > pageSize ? responseCursor(rawRows[pageSize - 1]) : null,
    rows,
    branches: branchRows,
    forms: formRows.sort((left, right) =>
      left.title.localeCompare(right.title, "id"),
    ),
    products: productRows,
  };
}

export async function getFormResponseExportRows(filters: FormResponseFilters) {
  await requireAdmin();
  const where = and(...conditions(filters));
  return getDatabase()
    .select({
      id: formSubmissions.id,
      submittedAt: formSubmissions.submittedAt,
      whatsappContinuedAt: formSubmissions.whatsappContinuedAt,
      formTitle: formSubmissions.formTitle,
      formSchema: formSubmissions.formSchema,
      valuesEncrypted: formSubmissions.valuesEncrypted,
      branchName: branches.name,
      productName: products.name,
    })
    .from(formSubmissions)
    .innerJoin(branches, eq(formSubmissions.branchId, branches.id))
    .innerJoin(
      productBranches,
      eq(formSubmissions.productBranchId, productBranches.id),
    )
    .innerJoin(products, eq(productBranches.productId, products.id))
    .where(where)
    .orderBy(asc(formSubmissions.submittedAt), asc(formSubmissions.id))
    .limit(1_000);
}

export async function getFormResponseDetail(id: string) {
  await requireAdmin();
  const [row] = await getDatabase()
    .select({
      id: formSubmissions.id,
      formTitle: formSubmissions.formTitle,
      formSchema: formSubmissions.formSchema,
      valuesEncrypted: formSubmissions.valuesEncrypted,
    })
    .from(formSubmissions)
    .where(eq(formSubmissions.id, id))
    .limit(1);
  if (!row) return null;
  const fields =
    pageBuilderFormFieldSchema
      .array()
      .safeParse((row.formSchema as { fields?: unknown }).fields).data ?? [];
  try {
    const values = decryptFormValues(row.valuesEncrypted);
    return {
      id: row.id,
      title: row.formTitle,
      decryptable: true,
      values: fields.map((field) => ({
        label: field.label,
        value: String(values[field.name] ?? ""),
      })),
    };
  } catch {
    return { id: row.id, title: row.formTitle, decryptable: false, values: [] };
  }
}

const identityBackfillSchema = z.object({
  branchId: z.uuid(),
  formId: z.uuid(),
  cursor: z.string().min(1).max(256).optional(),
});

function readableIdentityValue(
  values: Record<string, unknown>,
  fieldName: string | undefined,
) {
  if (!fieldName) return "";
  const value = values[fieldName];
  return typeof value === "string" ? value.trim() : "";
}

export async function backfillFormResponseIdentity(input: unknown) {
  const parsedInput = identityBackfillSchema.safeParse(input);
  if (!parsedInput.success)
    return { ok: false as const, code: "invalid_input" };

  const profile = await requireAdmin();
  const { branchId, formId, cursor: cursorValue } = parsedInput.data;
  const cursor = cursorValue ? parseCursor(cursorValue) : null;
  if (cursorValue && !cursor)
    return { ok: false as const, code: "invalid_cursor" };
  const db = getDatabase();
  const [layout] = await db
    .select({ publishedBlocks: branchPageBuilderLayouts.publishedBlocks })
    .from(branchPageBuilderLayouts)
    .where(eq(branchPageBuilderLayouts.branchId, branchId))
    .limit(1);
  const publishedBlocks = pageBuilderBlocksSchema.safeParse(
    layout?.publishedBlocks,
  );
  const form = publishedBlocks.success
    ? publishedBlocks.data.find(
        (
          block,
        ): block is Extract<
          (typeof publishedBlocks.data)[number],
          { type: "form" }
        > => block.type === "form" && block.id === formId,
      )
    : null;
  const identity = form?.responseIdentity;
  if (!identity?.nameField && !identity?.contactField)
    return { ok: false as const, code: "identity_not_configured" };

  const candidates = await db
    .select({
      id: formSubmissions.id,
      submittedAt: formSubmissions.submittedAt,
      formSchema: formSubmissions.formSchema,
      valuesEncrypted: formSubmissions.valuesEncrypted,
    })
    .from(formSubmissions)
    .where(
      and(
        eq(formSubmissions.branchId, branchId),
        eq(formSubmissions.formBlockId, formId),
        isNull(formSubmissions.identitySummaryEncrypted),
        ...(cursor
          ? [
              or(
                lt(formSubmissions.submittedAt, cursor.submittedAt),
                and(
                  eq(formSubmissions.submittedAt, cursor.submittedAt),
                  lt(formSubmissions.id, cursor.id),
                ),
              ),
            ]
          : []),
      ),
    )
    .orderBy(desc(formSubmissions.submittedAt), desc(formSubmissions.id))
    .limit(identityBackfillBatchSize + 1);
  const rows = candidates.slice(0, identityBackfillBatchSize);
  const nextCursor =
    candidates.length > identityBackfillBatchSize
      ? responseCursor(rows[rows.length - 1])
      : null;

  let updated = 0;
  let skipped = 0;
  for (const row of rows) {
    const fields = pageBuilderFormFieldSchema
      .array()
      .safeParse((row.formSchema as { fields?: unknown }).fields);
    if (!fields.success) {
      skipped += 1;
      continue;
    }
    const nameField = fields.data.find(
      (field) => field.name === identity?.nameField && field.type === "text",
    );
    const contactField = fields.data.find(
      (field) =>
        field.name === identity?.contactField &&
        ["text", "tel", "email"].includes(field.type),
    );
    if (
      (identity?.nameField && !nameField) ||
      (identity?.contactField && !contactField)
    ) {
      skipped += 1;
      continue;
    }

    let name: string;
    let contact: string;
    let encryptedSummary: string;
    let contactSearchHash: string | null;
    try {
      const values = decryptFormValues(row.valuesEncrypted);
      name = readableIdentityValue(values, identity?.nameField);
      contact = readableIdentityValue(values, identity?.contactField);
      if (!name && !contact) {
        skipped += 1;
        continue;
      }
      encryptedSummary = encryptFormValues({ name, contact });
      contactSearchHash = hashFormContactForSearch(contact);
    } catch {
      // Historical encryption failures must not block the rest of the batch.
      skipped += 1;
      continue;
    }
    const changed = await db
      .update(formSubmissions)
      .set({
        identitySummaryEncrypted: encryptedSummary,
        contactSearchHash,
      })
      .where(
        and(
          eq(formSubmissions.id, row.id),
          isNull(formSubmissions.identitySummaryEncrypted),
        ),
      )
      .returning({ id: formSubmissions.id });
    updated += changed.length;
  }

  await db.insert(auditLogs).values({
    adminId: profile.id,
    action: "backfill",
    entityType: "form_submission_identity",
    entityId: formId,
    changes: {
      branchId,
      updated,
      skipped,
      batchSize: identityBackfillBatchSize,
    },
  });
  return {
    ok: true as const,
    updated,
    skipped,
    nextCursor,
  };
}
