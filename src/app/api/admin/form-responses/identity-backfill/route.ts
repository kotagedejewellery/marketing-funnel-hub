import * as z from "zod";

import { serverEnv } from "@/lib/env/server";
import { backfillFormResponseIdentity } from "@/modules/form-submissions/management";

export const runtime = "nodejs";

const bodySchema = z.object({
  branchId: z.uuid(),
  formId: z.uuid(),
  cursor: z.string().min(1).max(256).optional(),
});

export async function POST(request: Request) {
  const expectedOrigin = new URL(serverEnv.NEXT_PUBLIC_SITE_URL).origin;
  if (request.headers.get("origin") !== expectedOrigin)
    return Response.json({ ok: false }, { status: 403 });
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ ok: false }, { status: 422 });

  const result = await backfillFormResponseIdentity(body.data);
  if (!result.ok)
    return Response.json(result, {
      status: result.code === "identity_not_configured" ? 422 : 400,
      headers: { "Cache-Control": "no-store" },
    });
  return Response.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}
