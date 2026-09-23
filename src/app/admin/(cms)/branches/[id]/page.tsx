import { redirect } from "next/navigation";

export default async function EditBranchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  redirect(`/admin/branches/${(await params).id}/link-bio`);
}
