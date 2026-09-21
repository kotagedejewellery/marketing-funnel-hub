import "server-only";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { getDatabase } from "@/lib/db/client";
import { adminProfiles } from "@/lib/db/schema";
import { getCurrentAuthUser } from "@/lib/supabase/server";

export async function getAdminAccess() {
  const user = await getCurrentAuthUser();
  if (!user) return { status: "unauthenticated" } as const;

  const [profile] = await getDatabase()
    .select({
      id: adminProfiles.id,
      displayName: adminProfiles.displayName,
      role: adminProfiles.role,
      isActive: adminProfiles.isActive,
    })
    .from(adminProfiles)
    .where(eq(adminProfiles.id, user.id))
    .limit(1);

  if (!profile?.isActive) return { status: "denied" } as const;
  return { status: "authorized", profile } as const;
}

export async function requireAdmin() {
  const access = await getAdminAccess();
  if (access.status === "unauthenticated") redirect("/admin/login");
  if (access.status === "denied") redirect("/admin/denied");
  return access.profile;
}

export async function requireTechnicalAdmin() {
  const profile = await requireAdmin();
  if (profile.role !== "technical_admin") redirect("/admin/denied");
  return profile;
}
