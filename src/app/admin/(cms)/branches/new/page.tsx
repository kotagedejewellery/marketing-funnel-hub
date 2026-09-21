import { redirect } from "next/navigation";

export default function NewBranchPage() {
  redirect("/admin/branches?create=1");
}
