"use server";

import { asc, eq, isNull, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDatabase } from "@/lib/db/client";
import { auditLogs, branches, faqs } from "@/lib/db/schema";
import { requireAdmin } from "@/modules/admin/access";

import { branchFaqSchema, faqSchema } from "./validation";

type ActionState = {
  message: string;
  errors: Record<string, string>;
  ok?: boolean;
};

export async function saveFaq(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireAdmin();
  const parsed = faqSchema.safeParse({
    ...Object.fromEntries(formData),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) {
    return {
      message: "Periksa kembali isian FAQ.",
      errors: Object.fromEntries(
        parsed.error.issues.map((issue) => [
          String(issue.path[0]),
          issue.message,
        ]),
      ),
    };
  }

  const { id, branchId, question, answer, isActive } = parsed.data;
  const db = getDatabase();
  const [branch] = branchId
    ? await db
        .select({ slug: branches.slug })
        .from(branches)
        .where(eq(branches.id, branchId))
        .limit(1)
    : [null];
  if (branchId && !branch) {
    return { message: "Cabang tidak ditemukan.", errors: {} };
  }

  let savedId: string;
  try {
    savedId = await db.transaction(async (tx) => {
      if (id) {
        const [current] = await tx
          .select({
            id: faqs.id,
            branchId: faqs.branchId,
            sortOrder: faqs.sortOrder,
          })
          .from(faqs)
          .where(eq(faqs.id, id))
          .limit(1);
        if (!current || current.branchId !== branchId) return "";
        await tx
          .update(faqs)
          .set({
            question,
            answer,
            sortOrder: current.sortOrder,
            isActive,
            updatedAt: new Date(),
          })
          .where(eq(faqs.id, id));
        await tx.insert(auditLogs).values({
          adminId: profile.id,
          action: "update",
          entityType: "faqs",
          entityId: id,
          changes: { fields: ["question", "answer", "isActive"] },
        });
        return id;
      }

      const [lastOrder] = await tx
        .select({ value: max(faqs.sortOrder) })
        .from(faqs)
        .where(branchId ? eq(faqs.branchId, branchId) : isNull(faqs.branchId));
      const nextSortOrder = Number(lastOrder?.value ?? -1) + 1;
      const [created] = await tx
        .insert(faqs)
        .values({
          branchId,
          question,
          answer,
          sortOrder: nextSortOrder,
          isActive,
        })
        .returning({ id: faqs.id });
      await tx.insert(auditLogs).values({
        adminId: profile.id,
        action: "create",
        entityType: "faqs",
        entityId: created.id,
        changes: { fields: ["question", "answer", "sortOrder", "isActive"] },
      });
      return created.id;
    });
  } catch {
    return { message: "Gagal menyimpan FAQ. Coba lagi.", errors: {} };
  }
  if (!savedId) return { message: "FAQ tidak ditemukan.", errors: {} };

  if (branch) revalidatePath(`/${branch.slug}`);
  else revalidatePath("/[slug]", "page");
  revalidatePath(
    branchId ? `/admin/branches/${branchId}/link-bio` : "/admin/settings",
  );
  return { message: "FAQ berhasil disimpan.", errors: {}, ok: true };
}

export async function startBranchFaqs(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireAdmin();
  const parsed = branchFaqSchema.safeParse({
    branchId: formData.get("branchId"),
  });
  if (!parsed.success) {
    return { message: "Cabang tidak valid.", errors: {} };
  }

  const { branchId } = parsed.data;
  const db = getDatabase();
  let slug: string;
  try {
    slug = await db.transaction(async (tx) => {
      const [branch] = await tx
        .select({ slug: branches.slug })
        .from(branches)
        .where(eq(branches.id, branchId))
        .limit(1);
      if (!branch) return "";

      const [existing] = await tx
        .select({ id: faqs.id })
        .from(faqs)
        .where(eq(faqs.branchId, branchId))
        .limit(1);
      if (existing) return branch.slug;

      const globalFaqs = await tx
        .select({
          question: faqs.question,
          answer: faqs.answer,
          sortOrder: faqs.sortOrder,
          isActive: faqs.isActive,
        })
        .from(faqs)
        .where(isNull(faqs.branchId))
        .orderBy(asc(faqs.sortOrder), asc(faqs.id));
      if (!globalFaqs.length) return "";

      await tx
        .insert(faqs)
        .values(globalFaqs.map((faq) => ({ ...faq, branchId })));
      await tx.insert(auditLogs).values({
        adminId: profile.id,
        action: "create",
        entityType: "branch_faqs",
        entityId: branchId,
        changes: { count: globalFaqs.length },
      });
      return branch.slug;
    });
  } catch {
    return { message: "Gagal menyalin FAQ. Coba lagi.", errors: {} };
  }
  if (!slug) {
    return { message: "Cabang atau FAQ global tidak ditemukan.", errors: {} };
  }

  revalidatePath(`/${slug}`);
  revalidatePath(`/admin/branches/${branchId}/link-bio`);
  return { message: "FAQ cabang siap dikustomisasi.", errors: {}, ok: true };
}
