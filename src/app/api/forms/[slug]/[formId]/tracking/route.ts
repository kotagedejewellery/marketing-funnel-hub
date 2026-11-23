import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import * as z from "zod";

import { getDatabase } from "@/lib/db/client";
import { branches, formSubmissions } from "@/lib/db/schema";
import { serverEnv } from "@/lib/env/server";
import { loadServerMetaTrackingConfig } from "@/modules/tracking/branch-meta-config";
import {
  attributionCookieName,
  externalIdCookieName,
  getTrackingContext,
  sessionCookieName,
} from "@/modules/tracking/journey";
import { sendFormMetaCapi } from "@/modules/tracking/meta-capi";
import { hashFormContinuationToken } from "@/modules/form-submissions/crypto";

export const runtime = "nodejs";

const paramsSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(120),
  formId: z.uuid(),
});
const bodySchema = z.object({
  eventId: z.uuid(),
  trackingToken: z.string().regex(/^[A-Za-z0-9_-]{40,128}$/),
});
const formSchema = z.object({
  metaTracking: z
    .object({
      eventId: z.uuid(),
      eventName: z.string().trim().min(1).max(100),
      productCategory: z.string().trim().min(1).max(120),
      branchName: z.string().trim().min(1).max(160),
    })
    .optional(),
});

function error(status: number, code: string, message: string) {
  return Response.json({ ok: false, error: { code, message } }, { status });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string; formId: string }> },
) {
  if (
    serverEnv.NEXT_PUBLIC_APP_ENV !== "local" &&
    serverEnv.TRACKING_ENABLED !== "true"
  )
    return Response.json({ ok: true });
  const expectedOrigin = new URL(serverEnv.NEXT_PUBLIC_SITE_URL).origin;
  if (request.headers.get("origin") !== expectedOrigin)
    return error(403, "INVALID_ORIGIN", "Same-origin request required.");
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return error(415, "UNSUPPORTED_MEDIA_TYPE", "JSON is required.");
  const params = paramsSchema.safeParse(await context.params);
  if (!params.success)
    return error(404, "FORM_NOT_FOUND", "Form tidak tersedia.");
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error(400, "INVALID_JSON", "Event form tidak valid.");
  }
  const input = bodySchema.safeParse(body);
  if (!input.success)
    return error(422, "INVALID_EVENT", "Event form tidak valid.");

  const db = getDatabase();
  const [submission] = await db
    .select({
      branchId: branches.id,
      formSchema: formSubmissions.formSchema,
    })
    .from(formSubmissions)
    .innerJoin(branches, eq(formSubmissions.branchId, branches.id))
    .where(
      and(
        eq(branches.slug, params.data.slug),
        eq(formSubmissions.formBlockId, params.data.formId),
        eq(
          formSubmissions.continuationTokenHash,
          hashFormContinuationToken(input.data.trackingToken),
        ),
      ),
    )
    .limit(1);
  const snapshot = formSchema.safeParse(submission?.formSchema);
  const metaTracking = snapshot.success ? snapshot.data.metaTracking : null;
  if (
    !submission ||
    !metaTracking ||
    metaTracking.eventId !== input.data.eventId
  )
    return Response.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } },
    );

  const cookieStore = await cookies();
  const tracking = getTrackingContext(
    cookieStore.get(sessionCookieName)?.value,
    cookieStore.get(attributionCookieName)?.value,
    cookieStore.get(externalIdCookieName)?.value,
  );
  if (!tracking)
    return Response.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } },
    );

  if (serverEnv.NEXT_PUBLIC_APP_ENV === "production") {
    try {
      const metaConfig = await loadServerMetaTrackingConfig(
        submission.branchId,
      );
      await sendFormMetaCapi(
        {
          eventId: input.data.eventId,
          eventTime: new Date().toISOString(),
          pageUrl: `${expectedOrigin}/${params.data.slug}`,
          metaEventName: metaTracking.eventName,
          productCategory: metaTracking.productCategory,
          branchName: metaTracking.branchName,
          attribution: tracking.attribution,
        },
        request,
        {
          fbp: cookieStore.get("_fbp")?.value,
          fbc: cookieStore.get("_fbc")?.value,
          externalId: cookieStore.get(externalIdCookieName)?.value,
        },
        metaConfig,
      );
    } catch {
      console.error("Meta CAPI form configuration failed", {
        eventId: input.data.eventId,
        provider: "meta_capi",
        category: "configuration",
      });
    }
  }
  return Response.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
