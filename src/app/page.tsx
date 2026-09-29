import { redirect } from "next/navigation";
import { connection } from "next/server";

import { loadDefaultLinkBioSlug } from "@/modules/public-content/data";
import { renderBranchLinkBio } from "@/modules/public-content/render";

export default async function HomePage() {
  await connection();
  const slug = await loadDefaultLinkBioSlug();
  if (!slug) redirect("/admin/login");

  const page = await renderBranchLinkBio(slug);
  if (!page) redirect("/admin/login");
  return page;
}
