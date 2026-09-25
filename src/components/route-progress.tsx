"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function internalDestination(event: MouseEvent) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return null;

  const target = event.target;
  if (!(target instanceof Element)) return null;
  const link = target.closest<HTMLAnchorElement>("a[href]");
  if (!link || link.target || link.hasAttribute("download")) return null;

  const destination = new URL(link.href, window.location.href);
  if (destination.origin !== window.location.origin) return null;
  if (destination.hash && destination.pathname === window.location.pathname)
    return null;

  const changesRoute =
    destination.pathname !== window.location.pathname ||
    destination.search !== window.location.search;
  if (!changesRoute) return null;

  return `${destination.pathname}?${destination.searchParams.toString()}`;
}

export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pendingDestination, setPendingDestination] = useState<string | null>(
    null,
  );
  const timeoutRef = useRef<number | null>(null);
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const pending =
    pendingDestination !== null && pendingDestination !== routeKey;

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const destination = internalDestination(event);
      if (!destination) return;
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      setPendingDestination(destination);
      timeoutRef.current = window.setTimeout(
        () => setPendingDestination(null),
        10_000,
      );
    }

    window.addEventListener("click", handleClick, true);
    return () => {
      window.removeEventListener("click", handleClick, true);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <>
      <span
        aria-hidden="true"
        data-pending={pending || undefined}
        className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-1 origin-left scale-x-0 bg-[var(--kgj-accent,#845422)] opacity-0 shadow-[0_2px_10px_rgba(132,84,34,0.35)] transition-[opacity,transform] duration-200 data-[pending=true]:scale-x-[0.72] data-[pending=true]:opacity-100 motion-reduce:transition-none"
      />
      <span className="sr-only" role="status" aria-live="polite">
        {pending ? "Memuat halaman" : ""}
      </span>
    </>
  );
}
