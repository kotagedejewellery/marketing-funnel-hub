import { and, eq, sql } from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";
import { branches, formSubmissions } from "@/lib/db/schema";
import { serverEnv } from "@/lib/env/server";
import { hashFormContinuationToken } from "@/modules/form-submissions/crypto";

export const runtime = "nodejs";

function error(status: number, code: string, message: string) {
  return Response.json({ ok: false, error: { code, message } }, { status });
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

  let body: { continuationToken?: unknown };
  try {
    body = (await request.json()) as { continuationToken?: unknown };
  } catch {
    return error(400, "INVALID_JSON", "Form response is invalid.");
  }
  if (
    typeof body.continuationToken !== "string" ||
    !/^[A-Za-z0-9_-]{40,128}$/.test(body.continuationToken)
  )
    return error(400, "INVALID_FORM", "Form tidak valid.");

  const db = getDatabase();
  const [branch] = await db
    .select({ id: branches.id })
    .from(branches)
    .where(eq(branches.slug, slug))
    .limit(1);
  if (!branch) return error(404, "FORM_NOT_FOUND", "Form tidak tersedia.");

  const [submission] = await db
    .update(formSubmissions)
    .set({
      whatsappContinuedAt: sql`coalesce(${formSubmissions.whatsappContinuedAt}, now())`,
    })
    .where(
      and(
        eq(formSubmissions.branchId, branch.id),
        eq(formSubmissions.formBlockId, formId),
        eq(
          formSubmissions.continuationTokenHash,
          hashFormContinuationToken(body.continuationToken),
        ),
      ),
    )
    .returning({ id: formSubmissions.id });
  if (!submission) return error(404, "FORM_NOT_FOUND", "Form tidak tersedia.");

  return Response.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
