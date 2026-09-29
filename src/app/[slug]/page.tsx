import { notFound } from "next/navigation";

import { renderBranchLinkBio } from "@/modules/public-content/render";

export const runtime = "nodejs";

export default async function BranchPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (slug.length > 120 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    notFound();
  }

  const page = await renderBranchLinkBio(slug);
  if (!page) notFound();
  return page;
}
