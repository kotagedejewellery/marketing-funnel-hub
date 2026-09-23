import { redirect } from "next/navigation";

export default function NewBranchPage() {
  redirect("/admin/link-bio?create=1");
}
