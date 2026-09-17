import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env/client", () => ({
  clientEnv: {
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_only",
  },
}));
vi.mock("@/lib/env/server", () => ({
  serverEnv: {
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    SUPABASE_SECRET_KEY: "sb_secret_test_only",
  },
}));

import { createBrowserAuth } from "./client";
import { createPrivilegedSupabase } from "./server";

describe("Supabase client boundaries", () => {
  it("exposes only browser Auth session operations", async () => {
    const auth = createBrowserAuth();

    expect(Object.keys(auth).sort()).toEqual([
      "getSession",
      "onAuthStateChange",
      "signInWithPassword",
      "signOut",
    ]);
    expect("from" in auth).toBe(false);
    expect("storage" in auth).toBe(false);
    expect("admin" in auth).toBe(false);
    const { data, error } = await auth.getSession();
    expect(error).toBeNull();
    expect(data.session).toBeNull();
  });

  it("keeps privileged Auth and Storage on the server boundary", () => {
    const privileged = createPrivilegedSupabase();

    expect(Object.keys(privileged).sort()).toEqual(["adminAuth", "storage"]);
    expect("from" in privileged).toBe(false);
  });
});
