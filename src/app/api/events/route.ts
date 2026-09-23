import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";
import { branches, productBranches } from "@/lib/db/schema";
import { serverEnv } from "@/lib/env/server";
import {
  branchSlugFromPagePath,
  canonicalEventSchema,
} from "@/modules/tracking/event";
import { sendMetaCapi } from "@/modules/tracking/meta-capi";
import {
  attributionCookieName,
  getTrackingContext,
  sessionCookieName,
} from "@/modules/tracking/journey";
import {
  existingEventStatus,
  resolveEventContext,
  storeEvent,
} from "@/modules/tracking/store";

export const runtime = "nodejs";
const maxBytes = 32 * 1024;
const maxSkewMs = 15 * 60 * 1000;

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
  const joined = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    joined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(joined);
}

export async function POST(request: Request) {
  if (
    serverEnv.NEXT_PUBLIC_APP_ENV !== "local" &&
    serverEnv.TRACKING_ENABLED !== "true"
  )
    return error(503, "TRACKING_DISABLED", "Tracking is not enabled.");
  const origin = request.headers.get("origin");
  const expectedOrigin = new URL(serverEnv.NEXT_PUBLIC_SITE_URL).origin;
  if (origin !== expectedOrigin)
    return error(403, "INVALID_ORIGIN", "Same-origin request required.");
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return error(415, "UNSUPPORTED_MEDIA_TYPE", "JSON is required.");
  if (Number(request.headers.get("content-length") ?? 0) > maxBytes)
    return error(413, "BODY_TOO_LARGE", "Event request is too large.");

  const cookieStore = await cookies();
  const context = getTrackingContext(
    cookieStore.get(sessionCookieName)?.value,
    cookieStore.get(attributionCookieName)?.value,
  );
  if (!context)
    return error(403, "INVALID_SESSION", "Tracking session is invalid.");

  const body = await readBody(request);
  if (body === null)
    return error(413, "BODY_TOO_LARGE", "Event request is too large.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return error(400, "INVALID_JSON", "Invalid JSON request.");
  }
  const result = canonicalEventSchema.safeParse(parsed);
  if (!result.success)
    return error(422, "INVALID_EVENT", "Invalid event payload.");
  const event = result.data;
  if (
    event.anonymousSessionId !== context.anonymousSessionId ||
    JSON.stringify(event.attribution) !== JSON.stringify(context.attribution)
  )
    return error(
      422,
      "INVALID_CONTEXT",
      "Event context does not match the session.",
    );
  if (Math.abs(Date.now() - Date.parse(event.eventTime)) > maxSkewMs)
    return error(
      422,
      "INVALID_TIME",
      "Event time is outside the allowed window.",
    );
  if (event.pageUrl && new URL(event.pageUrl).origin !== expectedOrigin)
    return error(422, "INVALID_PAGE_URL", "Page URL must use this origin.");
  const pagePath = event.pageUrl ? new URL(event.pageUrl).pathname : null;
  const branchSlug = pagePath ? branchSlugFromPagePath(pagePath) : null;
  if (!branchSlug)
    return error(422, "INVALID_PAGE_URL", "Page URL must be a branch page.");
  // Avoid persisting arbitrary query parameters from a client-supplied URL.
  const canonicalEvent = {
    ...event,
    pageUrl: `${expectedOrigin}${pagePath}`,
  };

  try {
    const db = getDatabase();
    const [pageBranch] = await db
      .select({ id: branches.id })
      .from(branches)
      .where(and(eq(branches.slug, branchSlug), eq(branches.isActive, true)))
      .limit(1);
    let validPageContext = Boolean(pageBranch);
    if (pageBranch && event.eventName === "Contact") {
      validPageContext = event.branch.id === pageBranch.id;
    }
    if (pageBranch && event.eventName === "ViewContent") {
      const [assignment] = await db
        .select({ id: productBranches.id })
        .from(productBranches)
        .where(
          and(
            eq(productBranches.branchId, pageBranch.id),
            eq(productBranches.productId, event.product.id),
            eq(productBranches.isActive, true),
          ),
        )
        .limit(1);
      validPageContext = Boolean(assignment);
    }
    if (!validPageContext) {
      const previous = await existingEventStatus(canonicalEvent);
      if (previous === "duplicate")
        return Response.json({
          ok: true,
          eventId: event.eventId,
          duplicate: true,
        });
      if (previous === "conflict")
        return error(
          409,
          "EVENT_CONFLICT",
          "Event ID already has different data.",
        );
      return error(
        422,
        "INVALID_CONTEXT",
        "Page and branch context do not match.",
      );
    }
    const resolved = await resolveEventContext(canonicalEvent);
    if (!resolved) {
      const previous = await existingEventStatus(canonicalEvent);
      if (previous === "duplicate")
        return Response.json({
          ok: true,
          eventId: event.eventId,
          duplicate: true,
        });
      if (previous === "conflict")
        return error(
          409,
          "EVENT_CONFLICT",
          "Event ID already has different data.",
        );
      return error(422, "INVALID_CONTEXT", "Product or branch is inactive.");
    }
    const status = await storeEvent(canonicalEvent, resolved);
    if (status === "conflict")
      return error(
        409,
        "EVENT_CONFLICT",
        "Event ID already has different data.",
      );
    if (
      status === "created" &&
      serverEnv.NEXT_PUBLIC_APP_ENV === "production"
    ) {
      await sendMetaCapi(canonicalEvent, resolved, request, {
        fbp: cookieStore.get("_fbp")?.value,
        fbc: cookieStore.get("_fbc")?.value,
      });
    }
    return Response.json({
      ok: true,
      eventId: event.eventId,
      ...(status === "duplicate" && { duplicate: true }),
    });
  } catch {
    return error(500, "INTERNAL_ERROR", "Event could not be stored.");
  }
}
