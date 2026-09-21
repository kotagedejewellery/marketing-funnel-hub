import type { ReactNode } from "react";

import { AccountMenu } from "@/components/admin/account-menu";
import { AdminNavigation } from "@/components/admin/navigation";
import { requireAdmin } from "@/modules/admin/access";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await requireAdmin();

  return (
    <div className="kgj-admin min-h-dvh pb-10 text-foreground lg:pl-24">
      <a
        href="#admin-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-10 focus:bg-card focus:p-3 focus:outline-2"
      >
        Lewati navigasi
      </a>
      <header className="relative z-30 mx-4 mt-4 flex items-center justify-between gap-3 sm:mx-6 lg:hidden">
        <p className="min-w-0 truncate text-sm font-semibold">
          Kotagede Jewellery <span className="text-muted-foreground">/ CMS</span>
        </p>
        <AccountMenu
          displayName={profile.displayName || "Admin"}
          role={profile.role}
          variant="bar"
        />
      </header>
      <aside className="kgj-admin-rail-shell relative z-20 mx-4 mt-3 sm:mx-6 lg:fixed lg:inset-y-0 lg:left-4 lg:m-0 lg:w-16">
        <AdminNavigation
          role={profile.role}
          displayName={profile.displayName || "Admin"}
        />
      </aside>
      <div className="min-w-0">
        <main
          id="admin-content"
          className="w-full min-w-0 px-4 py-8 sm:px-6 lg:px-8 lg:py-10"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
