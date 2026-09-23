import { redirect } from "next/navigation";

export default async function BranchesPage({
  searchParams,
}: {
  searchParams: Promise<{ create?: string }>;
}) {
  const { create } = await searchParams;
  redirect(create === "1" ? "/admin/link-bio?create=1" : "/admin/link-bio");
}
