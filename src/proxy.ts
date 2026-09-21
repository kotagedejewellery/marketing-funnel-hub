import type { NextRequest } from "next/server";

import { updateAdminSession } from "@/lib/supabase/proxy";
import { updatePublicJourney } from "@/modules/tracking/journey";

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin"))
    return updateAdminSession(request);
  if (
    (process.env.NEXT_PUBLIC_APP_ENV === "local" ||
      process.env.TRACKING_ENABLED === "true") &&
    request.method === "GET"
  )
    return updatePublicJourney(request);
  return undefined;
}

export const config = { matcher: ["/", "/admin/:path*"] };
