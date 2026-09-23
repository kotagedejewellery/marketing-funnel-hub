import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import * as z from "zod";

import { PreviewGuard } from "@/components/admin/preview-guard";
import { LinkBio } from "@/components/public/link-bio";
import { requireAdmin } from "@/modules/admin/access";
import { getBranch } from "@/modules/admin/branches/data";
import { loadBranchPublicContent } from "@/modules/public-content/data";

export const runtime = "nodejs";

export default async function AdminLinkBioPreview({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  await requireAdmin();
  await connection();
  const { pageId } = await params;
  if (pageId === "main") redirect("/admin/settings");
  if (!z.uuid().safeParse(pageId).success) notFound();

  const branch = await getBranch(pageId);
  const content = await loadBranchPublicContent(branch.slug, new Date(), true);
  if (!content) notFound();

  return (
    <div className="kgj-public">
      <p className="bg-[var(--kgj-dark)] px-4 py-2 text-center text-xs font-semibold text-[var(--primary-foreground)]">
        Pratinjau internal · versi tersimpan
        {!branch.isActive ? " · cabang nonaktif" : ""}
      </p>
      <PreviewGuard>
        <LinkBio content={content} preview />
      </PreviewGuard>
    </div>
  );
}
