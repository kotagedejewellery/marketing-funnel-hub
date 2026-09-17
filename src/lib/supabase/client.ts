import { createBrowserClient } from "@supabase/ssr";

import { clientEnv } from "@/lib/env/client";

// Source: https://supabase.com/docs/guides/auth/server-side/creating-a-client
export function createBrowserAuth() {
  const { auth } = createBrowserClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  return {
    getSession: () => auth.getSession(),
    signInWithPassword: (
      credentials: Parameters<typeof auth.signInWithPassword>[0],
    ) => auth.signInWithPassword(credentials),
    signOut: () => auth.signOut({ scope: "local" }),
    onAuthStateChange: (
      callback: Parameters<typeof auth.onAuthStateChange>[0],
    ) => auth.onAuthStateChange(callback),
  };
}
