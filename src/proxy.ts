import type { NextRequest } from "next/server";

import { updateAdminSession } from "@/lib/supabase/proxy";
import { updatePublicJourney } from "@/modules/tracking/journey";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/admin")) return updateAdminSession(request);
  if (
    (pathname === "/" || /^\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pathname)) &&
    (process.env.NEXT_PUBLIC_APP_ENV === "local" ||
      process.env.TRACKING_ENABLED === "true") &&
    request.method === "GET"
  )
    return updatePublicJourney(request);
  return undefined;
}

export const config = { matcher: ["/", "/:slug", "/admin/:path*"] };
