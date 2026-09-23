"use server";

import { eq, isNull, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDatabase } from "@/lib/db/client";
import { auditLogs, branches, campaigns } from "@/lib/db/schema";
import { requireAdmin } from "@/modules/admin/access";

import { campaignSchema, parseWibDate } from "./validation";

type ActionState = {
  message: string;
  errors: Record<string, string>;
  ok?: boolean;
};

export async function saveCampaign(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireAdmin();
  const parsed = campaignSchema.safeParse({
    ...Object.fromEntries(formData),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) {
    return {
      message: "Periksa kembali isian kampanye.",
      errors: Object.fromEntries(
        parsed.error.issues.map((issue) => [
          String(issue.path[0]),
          issue.message,
        ]),
      ),
    };
  }

  const input = parsed.data;
  const branchId = input.branchId || null;
  const [branch] = branchId
    ? await getDatabase()
        .select({ slug: branches.slug })
        .from(branches)
        .where(eq(branches.id, branchId))
        .limit(1)
    : [null];
  if (branchId && !branch)
    return {
      message: "Cabang tidak ditemukan.",
      errors: { branchId: "Cabang tidak valid." },
    };
  const values = {
    branchId,
    name: input.name,
    title: input.title,
    description: input.description,
    targetUrl: input.targetUrl,
    activeFrom: input.activeFrom ? parseWibDate(input.activeFrom) : null,
    activeUntil: input.activeUntil ? parseWibDate(input.activeUntil) : null,
    isActive: input.isActive,
  };

  let savedId: string;
  try {
    savedId = await getDatabase().transaction(async (tx) => {
      if (input.id) {
        const [current] = await tx
          .select({
            id: campaigns.id,
            branchId: campaigns.branchId,
            sortOrder: campaigns.sortOrder,
          })
          .from(campaigns)
          .where(eq(campaigns.id, input.id))
          .limit(1);
        if (!current || current.branchId !== branchId) return "";
        await tx
          .update(campaigns)
          .set({
            ...values,
            sortOrder: current.sortOrder,
            updatedAt: new Date(),
          })
          .where(eq(campaigns.id, input.id));
        await tx.insert(auditLogs).values({
          adminId: profile.id,
          action: "update",
          entityType: "campaigns",
          entityId: input.id,
          changes: { fields: Object.keys(values) },
        });
        return input.id;
      }
      const [lastOrder] = await tx
        .select({ value: max(campaigns.sortOrder) })
        .from(campaigns)
        .where(
          branchId
            ? eq(campaigns.branchId, branchId)
            : isNull(campaigns.branchId),
        );
      const createValues = {
        ...values,
        sortOrder: Number(lastOrder?.value ?? -1) + 1,
      };
      const [created] = await tx
        .insert(campaigns)
        .values(createValues)
        .returning({ id: campaigns.id });
      await tx.insert(auditLogs).values({
        adminId: profile.id,
        action: "create",
        entityType: "campaigns",
        entityId: created.id,
        changes: { fields: Object.keys(createValues) },
      });
      return created.id;
    });
  } catch {
    return { message: "Gagal menyimpan kampanye. Coba lagi.", errors: {} };
  }
  if (!savedId) return { message: "Kampanye tidak ditemukan.", errors: {} };

  if (branch) revalidatePath(`/${branch.slug}`);
  if (branchId) revalidatePath(`/admin/branches/${branchId}/link-bio`);
  revalidatePath("/admin/campaigns");
  if (formData.get("stayOnPage") === "1") {
    return { message: "Kampanye berhasil disimpan.", errors: {}, ok: true };
  }
  redirect(`/admin/campaigns/${savedId}?saved=1`);
}
