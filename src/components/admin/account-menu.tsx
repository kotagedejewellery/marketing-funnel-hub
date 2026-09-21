"use client";

import { useEffect, useRef, useState } from "react";

import { SignOutButton } from "@/components/admin/sign-out-button";

export function AccountMenu({
  displayName,
  role,
  variant,
}: {
  displayName: string;
  role: string;
  variant: "rail" | "bar";
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function closeOnOutsideClick(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        aria-label={variant === "rail" ? "Akun admin" : undefined}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={
          variant === "rail"
            ? "group relative flex size-11 items-center justify-center rounded-full text-[var(--kgj-on-dark-muted)] transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--kgj-accent-soft)] motion-reduce:transition-none"
            : "flex min-h-11 items-center gap-2 rounded-full bg-card px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
        }
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-5"
        >
          <circle cx="12" cy="8" r="3.5" />
          <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
        </svg>
        {variant === "bar" && <span>Akun</span>}
        {variant === "rail" && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-[calc(100%+0.75rem)] z-30 hidden -translate-y-1/2 rounded-lg bg-[var(--kgj-dark)] px-3 py-2 text-xs font-semibold whitespace-nowrap text-[var(--primary-foreground)] opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 lg:block motion-reduce:transition-none"
          >
            Akun
          </span>
        )}
      </button>
      {open && (
        <div
          className={`absolute z-50 w-56 rounded-2xl bg-card p-4 text-foreground shadow-[0_18px_36px_-26px_rgba(40,33,28,0.7)] ${variant === "rail" ? "bottom-0 left-[calc(100%+0.75rem)]" : "top-[calc(100%+0.5rem)] right-0"}`}
        >
          <p className="truncate text-sm font-semibold" title={displayName}>
            {displayName}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {role === "technical_admin" ? "Admin teknis" : "Admin"}
          </p>
          <div className="mt-4 border-t border-border pt-4">
            <SignOutButton />
          </div>
        </div>
      )}
    </div>
  );
}
