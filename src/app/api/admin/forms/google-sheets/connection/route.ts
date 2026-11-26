import * as z from "zod";

import { serverEnv } from "@/lib/env/server";
import { requireAdmin } from "@/modules/admin/access";
import { inspectGoogleSheetsDestination } from "@/modules/form-submissions/google-sheets";

export const runtime = "nodejs";

const inputSchema = z.object({
  spreadsheetId: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_-]{20,}$/),
});

export async function POST(request: Request) {
  if (
    request.headers.get("origin") !==
    new URL(serverEnv.NEXT_PUBLIC_SITE_URL).origin
  )
    return Response.json({ ok: false }, { status: 403 });
  const input = inputSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return Response.json({ ok: false }, { status: 422 });
  await requireAdmin();
  const result = await inspectGoogleSheetsDestination(input.data);
  return Response.json(result, {
    status: result.ok ? 200 : 409,
    headers: { "Cache-Control": "no-store" },
  });
}
