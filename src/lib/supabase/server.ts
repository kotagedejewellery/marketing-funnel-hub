import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { serverEnv } from "@/lib/env/server";

// Identity only: admin access still requires an active admin_profiles row.
// Sources: https://supabase.com/docs/guides/auth/server-side/creating-a-client
// https://nextjs.org/docs/app/api-reference/functions/cookies
export async function getCurrentAuthUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    serverEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components cannot write cookies; the admin Auth proxy will refresh them.
          }
        },
      },
    },
  );

  const { data, error } = await supabase.auth.getUser();
  return error ? null : data.user;
}

// Source: https://supabase.com/docs/guides/getting-started/api-keys
export function createPrivilegedSupabase() {
  const client = createClient(
    serverEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SECRET_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    },
  );

  return { adminAuth: client.auth.admin, storage: client.storage };
}
