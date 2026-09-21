"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AccountMenu } from "@/components/admin/account-menu";

const items = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: "M3 3h8v8H3z M13 3h8v5h-8z M13 10h8v11h-8z M3 13h8v8H3z",
  },
  {
    href: "/admin/content",
    label: "Konten",
    icon: "M5 3h11l3 3v15H5z M8 10h8 M8 14h8 M8 18h5",
  },
  {
    href: "/admin/campaigns",
    label: "Kampanye",
    icon: "M3 10h4l10-5v14L7 14H3z M7 14l2 6h3",
  },
  {
    href: "/admin/products",
    label: "Produk",
    icon: "M3 9 8 3h8l5 6-9 12z M3 9h18 M8 3l4 18 4-18",
  },
  {
    href: "/admin/branches",
    label: "Cabang",
    icon: "M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z M12 8a2 2 0 1 0 0 4a2 2 0 1 0 0-4",
  },
  {
    href: "/admin/links",
    label: "Tautan",
    icon: "M10 14l4-4 M8 16H6a4 4 0 0 1 0-8h4 M14 8h4a4 4 0 0 1 0 8h-4",
  },
  {
    href: "/admin/settings",
    label: "Pengaturan",
    icon: "M4 6h16 M4 12h16 M4 18h16 M9 4v4 M15 10v4 M9 16v4",
  },
  {
    href: "/admin/tracking",
    label: "Validasi tracking",
    icon: "M3 13h4l3-7 4 12 3-5h4",
  },
  {
    href: "/admin/profiles",
    label: "Profil admin",
    icon: "M8 10a3 3 0 1 0 0-6a3 3 0 1 0 0 6 M16 10a3 3 0 1 0 0-6a3 3 0 1 0 0 6 M2 20v-2a6 6 0 0 1 12 0v2z M14 14a6 6 0 0 1 8 6h-6",
  },
  {
    href: "/admin/diagnostics",
    label: "Diagnostik",
    icon: "M4 4h16v16H4z M7 12h3l2-4 2 8 2-4h1",
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
  const visibleItems = role === "technical_admin" ? items : items.slice(0, 8);

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
      <span
        aria-hidden="true"
        className="hidden size-10 shrink-0 items-center justify-center rounded-full bg-[var(--kgj-accent-soft)] text-[var(--kgj-dark)] lg:flex"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          className="size-5"
        >
          <path d="M12 2 21 12 12 22 3 12 12 2Z M3 12h18 M12 2l-4 10 4 10 4-10-4-10Z" />
        </svg>
      </span>
      <span
        aria-hidden="true"
        className="hidden h-px w-8 bg-white/20 lg:block"
      />
      <nav
        aria-label="Navigasi admin"
        className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto lg:w-full lg:flex-col lg:overflow-visible"
      >
        {visibleItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.href}
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
