import "server-only";

import { and, asc, count, desc, eq, gte, lt, type SQL } from "drizzle-orm";
import * as z from "zod";

import { getDatabase } from "@/lib/db/client";
import {
  branches,
  formSubmissions,
  productBranches,
  products,
} from "@/lib/db/schema";
import { requireAdmin } from "@/modules/admin/access";
import { pageBuilderFormFieldSchema } from "@/modules/page-builder/schema";

import { decryptFormValues } from "./crypto";

const pageSize = 50;
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
    page: z.coerce.number().int().positive().max(10_000).default(1),
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
  page: number;
};

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
    page: value.page,
  };
}

function jakartaStart(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day - 1, 17));
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
  return result;
}

async function responseRows(
  filters: FormResponseFilters,
  limit: number,
  offset = 0,
) {
  const where = and(...conditions(filters));
  return getDatabase()
    .select({
      id: formSubmissions.id,
      submittedAt: formSubmissions.submittedAt,
      formTitle: formSubmissions.formTitle,
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
    .where(where)
    .orderBy(desc(formSubmissions.submittedAt), desc(formSubmissions.id))
    .limit(limit)
    .offset(offset);
}

export async function getFormResponseManagement(filters: FormResponseFilters) {
  await requireAdmin();
  const db = getDatabase();
  const where = and(...conditions(filters));
  const [totalRow, branchRows, formRows, productRows] = await Promise.all([
    db.select({ value: count() }).from(formSubmissions).where(where),
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
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const normalizedFilters = {
    ...filters,
    page: Math.min(filters.page, pageCount),
  };
  const rows = await responseRows(
    normalizedFilters,
    pageSize,
    (normalizedFilters.page - 1) * pageSize,
  );
  return {
    filters: normalizedFilters,
    total,
    pageCount,
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
    .limit(10_000);
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
