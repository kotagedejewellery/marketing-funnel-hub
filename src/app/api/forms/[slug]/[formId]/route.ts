import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { getDatabase } from "@/lib/db/client";
import {
  branches,
  branchPageBuilderLayouts,
  formSubmissionDeliveries,
  formSubmissions,
  productBranches,
  products,
  siteSettings,
} from "@/lib/db/schema";
import { serverEnv } from "@/lib/env/server";
import { resolveWhatsappCta } from "@/modules/public-content/links";
import {
  pageBuilderBlocksSchema,
  type PageBuilderBlock,
} from "@/modules/page-builder/schema";
import {
  createFormContinuationToken,
  encryptFormValues,
  hashFormContactForSearch,
  hashFormContinuationToken,
} from "@/modules/form-submissions/crypto";
import { deliverGoogleSheetsFormSubmission } from "@/modules/form-submissions/delivery";
import { canSubmitForm } from "@/modules/form-submissions/rate-limit";
import { validatedFormValues } from "@/modules/form-submissions/validation";

export const runtime = "nodejs";

const maxBytes = 32 * 1024;

function error(status: number, code: string, message: string) {
  return Response.json({ ok: false, error: { code, message } }, { status });
}

function identitySummary(
  form: Extract<PageBuilderBlock, { type: "form" }>,
  values: Record<string, string | boolean>,
) {
  if (!form.responseIdentity) return null;
  const read = (fieldName: string | undefined) => {
    const value = fieldName ? values[fieldName] : undefined;
    return typeof value === "string" ? value.trim() : "";
  };
  const contact = read(form.responseIdentity.contactField);
  return {
    encrypted: encryptFormValues({
      name: read(form.responseIdentity.nameField),
      contact,
    }),
    contactSearchHash: hashFormContactForSearch(contact),
  };
}

async function readBody(request: Request): Promise<string | null> {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string; formId: string }> },
) {
  const { slug, formId } = await context.params;
  const expectedOrigin = new URL(serverEnv.NEXT_PUBLIC_SITE_URL).origin;
  if (request.headers.get("origin") !== expectedOrigin)
    return error(403, "INVALID_ORIGIN", "Same-origin request required.");
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return error(415, "UNSUPPORTED_MEDIA_TYPE", "JSON is required.");
  if (Number(request.headers.get("content-length") ?? 0) > maxBytes)
    return error(413, "BODY_TOO_LARGE", "Form response is too large.");
  if (!canSubmitForm(request, formId))
    return error(
      429,
      "RATE_LIMITED",
      "Terlalu banyak pengiriman form. Coba lagi nanti.",
    );

  let body: { values?: unknown; website?: unknown };
  try {
    const raw = await readBody(request);
    if (raw === null)
      return error(413, "BODY_TOO_LARGE", "Form response is too large.");
    body = JSON.parse(raw) as { values?: unknown; website?: unknown };
  } catch {
    return error(400, "INVALID_JSON", "Form response is invalid.");
  }
  if (body.website) return error(400, "INVALID_FORM", "Form tidak valid.");

  const db = getDatabase();
  const [branch] = await db
    .select({
      id: branches.id,
      name: branches.name,
      whatsappNumber: branches.whatsappNumber,
      ctaLabel: branches.ctaLabel,
    })
    .from(branches)
    .where(and(eq(branches.slug, slug), eq(branches.isActive, true)))
    .limit(1);
  if (!branch) return error(404, "FORM_NOT_FOUND", "Form tidak tersedia.");
  const [layout] = await db
    .select({
      publishedBlocks: branchPageBuilderLayouts.publishedBlocks,
      isPublished: branchPageBuilderLayouts.isPublished,
    })
    .from(branchPageBuilderLayouts)
    .where(eq(branchPageBuilderLayouts.branchId, branch.id))
    .limit(1);
  const parsed = layout?.isPublished
    ? pageBuilderBlocksSchema.safeParse(layout.publishedBlocks)
    : null;
  const form = parsed?.success
    ? parsed.data.find(
        (
          block,
        ): block is Extract<(typeof parsed.data)[number], { type: "form" }> =>
          block.type === "form" && block.id === formId && block.isVisible,
      )
    : null;
  if (!form) return error(404, "FORM_NOT_FOUND", "Form tidak tersedia.");
  const values = validatedFormValues(form.fields, body.values);
  if (!values) return error(422, "INVALID_FORM", "Periksa kembali isian form.");

  const [assignment] = await db
    .select({
      id: productBranches.id,
      name: products.name,
      category: products.slug,
      ctaLabel: productBranches.ctaLabel,
      message: productBranches.whatsappMessageTemplate,
    })
    .from(productBranches)
    .innerJoin(products, eq(productBranches.productId, products.id))
    .where(
      and(
        eq(productBranches.id, form.assignmentId),
        eq(productBranches.branchId, branch.id),
        eq(productBranches.isActive, true),
        eq(products.isActive, true),
      ),
    )
    .limit(1);
  if (!assignment)
    return error(422, "CTA_UNAVAILABLE", "CTA WhatsApp tidak tersedia.");
  const [site] = await db
    .select({
      defaultCtaLabel: siteSettings.defaultCtaLabel,
      defaultWhatsappMessage: siteSettings.defaultWhatsappMessage,
    })
    .from(siteSettings)
    .limit(1);
  if (!site) return error(503, "FORM_UNAVAILABLE", "Form belum siap.");

  const continuationToken = createFormContinuationToken();
  const identity = identitySummary(form, values);
  const metaTracking = form.metaEventName
    ? { eventId: randomUUID(), eventName: form.metaEventName }
    : null;
  let googleSheetsDeliveryId: string | null = null;
  try {
    googleSheetsDeliveryId = await db.transaction(async (tx) => {
      const [submission] = await tx
        .insert(formSubmissions)
        .values({
          branchId: branch.id,
          productBranchId: assignment.id,
          formBlockId: form.id,
          formTitle: form.title,
          formSchema: {
            fields: form.fields,
            ...(form.responseIdentity && {
              responseIdentity: form.responseIdentity,
            }),
            ...(metaTracking && {
              metaTracking: {
                ...metaTracking,
                productCategory: assignment.category,
                branchName: branch.name,
              },
            }),
          },
          valuesEncrypted: encryptFormValues(values),
          identitySummaryEncrypted: identity?.encrypted ?? null,
          contactSearchHash: identity?.contactSearchHash ?? null,
          continuationTokenHash: hashFormContinuationToken(continuationToken),
        })
        .returning({ id: formSubmissions.id });
      if (form.submissionDestination !== "google_sheets" || !form.googleSheets)
        return null;
      const [delivery] = await tx
        .insert(formSubmissionDeliveries)
        .values({
          submissionId: submission.id,
          provider: "google_sheets",
          destination: form.googleSheets,
        })
        .returning({ id: formSubmissionDeliveries.id });
      return delivery.id;
    });
  } catch {
    return error(
      503,
      "FORM_UNAVAILABLE",
      "Form belum dapat disimpan. Coba lagi.",
    );
  }
  if (googleSheetsDeliveryId)
    await deliverGoogleSheetsFormSubmission(googleSheetsDeliveryId).catch(
      () => undefined,
    );
  const destination = resolveWhatsappCta({
    number: branch.whatsappNumber,
    product: assignment.name,
    branch: branch.name,
    assignmentLabel: assignment.ctaLabel,
    branchLabel: branch.ctaLabel,
    defaultLabel: site.defaultCtaLabel,
    assignmentMessage: assignment.message,
    defaultMessage: site.defaultWhatsappMessage,
  });
  return Response.json(
    {
      ok: true,
      whatsappUrl: destination.whatsappUrl,
      ctaLabel: destination.ctaLabel,
      continuationToken,
      ...(metaTracking && {
        metaTracking: { ...metaTracking, trackingToken: continuationToken },
      }),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
