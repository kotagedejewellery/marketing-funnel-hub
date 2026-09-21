"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createBrowserAuth } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  async function signOut() {
    setPending(true);
    setError(false);
    try {
      const { error: authError } = await createBrowserAuth().signOut();
      if (authError) {
        setError(true);
        return;
      }
      router.replace("/admin/login");
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <span className="flex w-full flex-col gap-1">
      <button
        type="button"
        onClick={signOut}
        disabled={pending}
        className="min-h-11 w-full rounded-full bg-secondary px-5 text-sm font-semibold transition-colors hover:bg-[var(--kgj-accent-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
      >
        {pending ? "Keluar..." : "Keluar"}
      </button>
      {error && <span role="alert" className="text-xs">Gagal keluar. Coba lagi.</span>}
    </span>
  );
}
