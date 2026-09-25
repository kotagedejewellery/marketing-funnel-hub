"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import * as z from "zod";

import { createBrowserAuth } from "@/lib/supabase/client";

const loginSchema = z.object({
  email: z.email("Masukkan alamat email yang valid."),
  password: z.string().min(1, "Masukkan kata sandi."),
});

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({ email: "", password: "" });

    const form = new FormData(event.currentTarget);
    const result = loginSchema.safeParse({
      email: form.get("email"),
      password: form.get("password"),
    });
    if (!result.success) {
      setFieldErrors({
        email:
          result.error.issues.find((issue) => issue.path[0] === "email")
            ?.message ?? "",
        password:
          result.error.issues.find((issue) => issue.path[0] === "password")
            ?.message ?? "",
      });
      return;
    }

    setPending(true);
    try {
      const { error: authError } = await createBrowserAuth().signInWithPassword(
        result.data,
      );
      if (authError) {
        setError("Email atau kata sandi tidak sesuai.");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Masuk belum berhasil. Silakan coba lagi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-9 space-y-6" noValidate>
      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-semibold">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? "email-error" : undefined}
          onChange={() =>
            fieldErrors.email &&
            setFieldErrors((current) => ({ ...current, email: "" }))
          }
          className="min-h-12 w-full rounded-sm border border-border bg-card px-4 text-base placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--kgj-accent)] aria-[invalid=true]:border-destructive"
          placeholder="nama@contoh.com"
        />
        {fieldErrors.email && (
          <p id="email-error" className="mt-2 text-sm text-destructive">
            {fieldErrors.email}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-semibold">
          Kata sandi
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={
              fieldErrors.password ? "password-error" : undefined
            }
            onChange={() =>
              fieldErrors.password &&
              setFieldErrors((current) => ({ ...current, password: "" }))
            }
            className="min-h-12 w-full rounded-sm border border-border bg-card px-4 pr-28 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--kgj-accent)] aria-[invalid=true]:border-destructive"
          />
          <button
            type="button"
            aria-pressed={showPassword}
            onClick={() => setShowPassword((visible) => !visible)}
            className="absolute inset-y-0 right-1 min-w-24 cursor-pointer px-2 text-sm font-medium text-[var(--kgj-accent)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {showPassword ? "Sembunyikan" : "Tampilkan"}
          </button>
        </div>
        {fieldErrors.password && (
          <p id="password-error" className="mt-2 text-sm text-destructive">
            {fieldErrors.password}
          </p>
        )}
      </div>
      {error && (
        <p
          role="alert"
          className="border-l-2 border-destructive bg-card px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending || undefined}
        className="min-h-12 w-full cursor-pointer bg-primary px-5 font-semibold text-primary-foreground transition-colors hover:bg-[var(--kgj-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--kgj-accent)] disabled:cursor-wait disabled:opacity-50"
      >
        {pending ? "Sedang masuk..." : "Masuk ke CMS"}
      </button>
    </form>
  );
}
