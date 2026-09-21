import { redirect } from "next/navigation";

export default function NewLinkPage() {
  redirect("/admin/links?create=1");
}
