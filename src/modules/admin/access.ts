import "server-only";

import { redirect } from "next/navigation";

import { getCurrentAdminProfile } from "@/modules/admin/auth";

export async function getAdminAccess() {
  const profile = await getCurrentAdminProfile();
  if (!profile) return { status: "unauthenticated" } as const;
  return { status: "authorized", profile } as const;
}

export async function requireAdmin() {
  const access = await getAdminAccess();
  if (access.status === "unauthenticated") redirect("/admin/login");
  return access.profile;
}

export async function requireTechnicalAdmin() {
  const profile = await requireAdmin();
  if (profile.role !== "technical_admin") redirect("/admin/denied");
  return profile;
}
