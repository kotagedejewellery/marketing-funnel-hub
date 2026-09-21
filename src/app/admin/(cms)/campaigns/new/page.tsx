import { redirect } from "next/navigation";

export default function NewCampaignPage() {
  redirect("/admin/campaigns?create=1");
}
