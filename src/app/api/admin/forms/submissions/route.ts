import { requireAdmin } from "@/modules/admin/access";

export const runtime = "nodejs";

export async function GET() {
  await requireAdmin();
  return Response.json(
    {
      ok: false,
      error: {
        code: "MOVED",
        message: "Buka menu Respons Form untuk melihat respons.",
      },
    },
    { status: 410, headers: { "Cache-Control": "no-store" } },
  );
}
