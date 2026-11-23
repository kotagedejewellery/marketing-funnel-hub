import * as z from "zod";

import { getDatabase } from "@/lib/db/client";
import { auditLogs } from "@/lib/db/schema";
import { serverEnv } from "@/lib/env/server";
import { requireAdmin } from "@/modules/admin/access";
import { retryFailedGoogleSheetsFormSubmission } from "@/modules/form-submissions/delivery";

export const runtime = "nodejs";

const paramsSchema = z.object({ id: z.uuid() });

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const expectedOrigin = new URL(serverEnv.NEXT_PUBLIC_SITE_URL).origin;
  if (request.headers.get("origin") !== expectedOrigin)
    return Response.json({ ok: false }, { status: 403 });
  const params = paramsSchema.safeParse(await context.params);
  if (!params.success) return Response.json({ ok: false }, { status: 422 });
  const profile = await requireAdmin();
  const result = await retryFailedGoogleSheetsFormSubmission(params.data.id);
  await getDatabase()
    .insert(auditLogs)
    .values({
      adminId: profile.id,
      action: "retry",
      entityType: "form_submission_delivery",
      entityId: params.data.id,
      changes: {
        provider: "google_sheets",
        status: result.ok ? "delivered" : result.code,
      },
    });
  return Response.json(
    { ok: result.ok },
    {
      status: result.ok ? 200 : 409,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
