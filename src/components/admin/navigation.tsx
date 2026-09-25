"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { AccountMenu } from "@/components/admin/account-menu";

const items: {
  href: string;
  label: string;
  icon: string;
  separatorBefore?: boolean;
  technicalOnly?: boolean;
}[] = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: "M3 3h8v8H3z M13 3h8v5h-8z M13 10h8v11h-8z M3 13h8v8H3z",
  },
  {
    href: "/admin/link-bio",
    label: "Halaman Link Bio",
    icon: "M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z M12 8a2 2 0 1 0 0 4a2 2 0 1 0 0-4",
  },
  {
    href: "/admin/settings",
    label: "Standar & Template KGJ",
    icon: "M4 6h16 M4 12h16 M4 18h16 M9 4v4 M15 10v4 M9 16v4",
    separatorBefore: true,
  },
  {
    href: "/admin/tracking",
    label: "Analytics",
    icon: "M3 13h4l3-7 4 12 3-5h4",
  },
  {
    href: "/admin/profiles",
    label: "Profil admin",
    icon: "M8 10a3 3 0 1 0 0-6a3 3 0 1 0 0 6 M16 10a3 3 0 1 0 0-6a3 3 0 1 0 0 6 M2 20v-2a6 6 0 0 1 12 0v2z M14 14a6 6 0 0 1 8 6h-6",
    technicalOnly: true,
  },
  {
    href: "/admin/diagnostics",
    label: "Diagnostik",
    icon: "M4 4h16v16H4z M7 12h3l2-4 2 8 2-4h1",
    technicalOnly: true,
  },
];

export function AdminNavigation({
  role,
  displayName,
}: {
  role: string;
  displayName: string;
}) {
  const pathname = usePathname();
  const visibleItems = items.filter(
    (item) => !item.technicalOnly || role === "technical_admin",
  );

  return (
    <div className="kgj-admin-rail relative flex items-center gap-1 rounded-full bg-[var(--kgj-dark)] p-2 text-[var(--kgj-on-dark-muted)] shadow-[0_20px_45px_-32px_rgba(40,33,28,0.7)] lg:h-full lg:flex-col lg:rounded-none lg:py-10">
      <span
        aria-hidden="true"
        className="absolute top-0 left-1/2 z-20 hidden size-11 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background lg:block"
      />
      <span
        aria-hidden="true"
        className="absolute bottom-0 left-1/2 z-20 hidden size-11 -translate-x-1/2 translate-y-1/2 rounded-full bg-background lg:block"
      />
      <nav
        aria-label="Navigasi admin"
        className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto lg:w-full lg:flex-col lg:overflow-visible"
      >
        {visibleItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(`${item.href}/`)) ||
            (item.href === "/admin/link-bio" &&
              pathname.startsWith("/admin/branches/") &&
              pathname.endsWith("/link-bio"));
          return (
            <Fragment key={item.href}>
              {item.separatorBefore && (
                <span
                  aria-hidden="true"
                  className="mx-1 h-7 w-px shrink-0 bg-white/20 lg:mx-0 lg:my-2 lg:h-px lg:w-8"
                />
              )}
              <Link
                href={item.href}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className={`group relative flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--kgj-accent-soft)] motion-reduce:transition-none ${item.href === "/admin/settings" ? "lg:mt-auto" : ""} ${active ? "bg-card text-[var(--kgj-dark)] shadow-[0_8px_20px_-14px_rgba(0,0,0,0.8)]" : "text-[var(--kgj-on-dark-muted)] hover:bg-white/15"}`}
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
                  <path d={item.icon} />
                </svg>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-[calc(100%+0.75rem)] z-30 hidden -translate-y-1/2 rounded-lg bg-[var(--kgj-dark)] px-3 py-2 text-xs font-semibold whitespace-nowrap text-[var(--primary-foreground)] opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 lg:block motion-reduce:transition-none"
                >
                  {item.label}
                </span>
              </Link>
            </Fragment>
          );
        })}
      </nav>
      <span
        aria-hidden="true"
        className="hidden h-px w-8 bg-white/20 lg:block"
      />
      <div className="hidden lg:block">
        <AccountMenu displayName={displayName} role={role} variant="rail" />
      </div>
    </div>
  );
}
