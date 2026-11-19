import { and, eq } from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";
import {
  branches,
  branchPageBuilderLayouts,
  formSubmissions,
  productBranches,
  products,
  siteSettings,
} from "@/lib/db/schema";
import { serverEnv } from "@/lib/env/server";
import { resolveWhatsappCta } from "@/modules/public-content/links";
import { pageBuilderBlocksSchema } from "@/modules/page-builder/schema";
import {
  createFormContinuationToken,
  encryptFormValues,
  hashFormContinuationToken,
} from "@/modules/form-submissions/crypto";
import { canSubmitForm } from "@/modules/form-submissions/rate-limit";
import { validatedFormValues } from "@/modules/form-submissions/validation";

export const runtime = "nodejs";

const maxBytes = 32 * 1024;

function error(status: number, code: string, message: string) {
  return Response.json({ ok: false, error: { code, message } }, { status });
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
  try {
    await db.insert(formSubmissions).values({
      branchId: branch.id,
      productBranchId: assignment.id,
      formBlockId: form.id,
      formTitle: form.title,
      formSchema: { fields: form.fields },
      valuesEncrypted: encryptFormValues(values),
      continuationTokenHash: hashFormContinuationToken(continuationToken),
    });
  } catch {
    return error(
      503,
      "FORM_UNAVAILABLE",
      "Form belum dapat disimpan. Coba lagi.",
    );
  }
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
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
