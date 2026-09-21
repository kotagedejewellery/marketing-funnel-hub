import { timingSafeEqual } from "node:crypto";

import { asc, inArray, lt } from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";
import { events } from "@/lib/db/schema";
import { serverEnv } from "@/lib/env/server";

export const runtime = "nodejs";

function authorized(request: Request) {
  const supplied = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${serverEnv.CRON_SECRET}`;
  const left = Buffer.from(supplied);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return Response.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Unauthorized." } },
      { status: 401 },
    );
  }

  const cutoff = new Date();
  cutoff.setUTCMonth(cutoff.getUTCMonth() - 24);
  try {
    const db = getDatabase();
    const expired = await db
      .select({ id: events.id })
      .from(events)
      .where(lt(events.createdAt, cutoff))
      .orderBy(asc(events.createdAt))
      .limit(500);
    if (expired.length === 0) return Response.json({ ok: true, deleted: 0 });

    const deleted = await db
      .delete(events)
      .where(
        inArray(
          events.id,
          expired.map((row) => row.id),
        ),
      )
      .returning({ id: events.id });
    return Response.json({ ok: true, deleted: deleted.length });
  } catch {
    return Response.json(
      {
        ok: false,
        error: { code: "INTERNAL_ERROR", message: "Retention job failed." },
      },
      { status: 500 },
    );
  }
}
