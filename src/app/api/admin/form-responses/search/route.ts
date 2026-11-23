import * as z from "zod";

import { searchFormResponsesByContact } from "@/modules/form-submissions/management";

export const runtime = "nodejs";

const bodySchema = z.object({ contact: z.string().trim().min(3).max(160) });

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
  const input = bodySchema.safeParse(body);
  if (!input.success) return Response.json({ ok: false }, { status: 422 });
  return Response.json(
    { ok: true, rows: await searchFormResponsesByContact(input.data.contact) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
