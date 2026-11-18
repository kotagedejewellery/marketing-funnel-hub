import * as z from "zod";

import { getFormResponseDetail } from "@/modules/form-submissions/management";

export const runtime = "nodejs";

const paramsSchema = z.object({ id: z.uuid() });

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success)
    return Response.json(
      {
        ok: false,
        error: { code: "INVALID_RESPONSE", message: "Respons tidak valid." },
      },
      { status: 422 },
    );
  const detail = await getFormResponseDetail(parsed.data.id);
  if (!detail)
    return Response.json(
      {
        ok: false,
        error: { code: "NOT_FOUND", message: "Respons tidak ditemukan." },
      },
      { status: 404 },
    );
  return Response.json(detail, { headers: { "Cache-Control": "no-store" } });
}
