"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDatabase } from "@/lib/db/client";
import { auditLogs, branches, contentSections } from "@/lib/db/schema";
import { requireAdmin } from "@/modules/admin/access";

import { branchPageSchema, branchSectionKeys } from "./page-validation";

type ActionState = {
  message: string;
  errors: Record<string, string>;
  ok?: boolean;
};

export async function saveBranchPage(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireAdmin();
  const mode = formData.get("mode");
  if (mode !== "identity" && mode !== "sections") {
    return { message: "Jenis perubahan halaman tidak valid.", errors: {} };
  }
  const parsed = branchPageSchema.safeParse({
    branchId: formData.get("branchId"),
    headline: formData.get("headline"),
    introduction: formData.get("introduction"),
    sections: branchSectionKeys.map((sectionKey) => ({
      sectionKey,
      publicTitle: formData.get(`title_${sectionKey}`),
      sortOrder: formData.get(`order_${sectionKey}`),
      isActive: formData.get(`active_${sectionKey}`) === "on",
    })),
  });
  if (!parsed.success) {
    return {
      message: "Periksa kembali konten halaman cabang.",
      errors: Object.fromEntries(
        parsed.error.issues.map((issue) => [
          String(issue.path[0]),
          issue.message,
        ]),
      ),
    };
  }

  const { branchId, headline, introduction, sections } = parsed.data;
  const db = getDatabase();
  let slug: string;
  try {
    slug = await db.transaction(async (tx) => {
      const [branch] = await tx
        .select({ id: branches.id, slug: branches.slug })
        .from(branches)
        .where(eq(branches.id, branchId))
        .limit(1);
      if (!branch) return "";

      const [globalSections, scopedSections] =
        mode === "sections"
          ? await Promise.all([
              tx
                .select({
                  sectionKey: contentSections.sectionKey,
                  label: contentSections.label,
                  publicTitle: contentSections.publicTitle,
                })
                .from(contentSections)
                .where(isNull(contentSections.branchId)),
              tx
                .select({
                  id: contentSections.id,
                  sectionKey: contentSections.sectionKey,
                  publicTitle: contentSections.publicTitle,
                })
                .from(contentSections)
                .where(eq(contentSections.branchId, branchId)),
            ])
          : [[], []];

      if (mode === "identity") {
        await tx
          .update(branches)
          .set({ headline, introduction, updatedAt: new Date() })
          .where(eq(branches.id, branchId));
      }
      for (const section of mode === "sections" ? sections : []) {
        const existing = scopedSections.find(
          (item) => item.sectionKey === section.sectionKey,
        );
        if (existing) {
          await tx
            .update(contentSections)
            .set({
              publicTitle: section.publicTitle,
              sortOrder: section.sortOrder,
              isActive: section.isActive,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(contentSections.id, existing.id),
                eq(contentSections.branchId, branchId),
              ),
            );
        } else {
          const label = globalSections.find(
            (item) => item.sectionKey === section.sectionKey,
          )?.label;
          if (!label) throw new Error("Global section is missing.");
          await tx.insert(contentSections).values({
            branchId,
            sectionKey: section.sectionKey,
            label,
            publicTitle: section.publicTitle,
            sortOrder: section.sortOrder,
            isActive: section.isActive,
          });
        }
      }
      await tx.insert(auditLogs).values({
        adminId: profile.id,
        action: "update",
        entityType: "branch_page",
        entityId: branchId,
        changes: {
          fields:
            mode === "identity" ? ["headline", "introduction"] : ["sections"],
        },
      });
      return branch.slug;
    });
  } catch {
    return {
      message: "Gagal menyimpan halaman cabang. Coba lagi.",
      errors: {},
    };
  }
  if (!slug) return { message: "Cabang tidak ditemukan.", errors: {} };

  revalidatePath(`/${slug}`);
  revalidatePath(`/admin/branches/${branchId}/link-bio`);
  return {
    message:
      mode === "identity"
        ? "Profil cabang tersimpan."
        : "Susunan cabang tersimpan.",
    errors: {},
    ok: true,
  };
}
