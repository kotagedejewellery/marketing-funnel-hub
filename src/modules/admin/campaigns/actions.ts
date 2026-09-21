"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDatabase } from "@/lib/db/client";
import { auditLogs, campaigns } from "@/lib/db/schema";
import { requireAdmin } from "@/modules/admin/access";

import { campaignSchema, parseWibDate } from "./validation";

type ActionState = { message: string; errors: Record<string, string> };

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
  const values = {
    name: input.name,
    title: input.title,
    description: input.description,
    targetUrl: input.targetUrl,
    activeFrom: input.activeFrom ? parseWibDate(input.activeFrom) : null,
    activeUntil: input.activeUntil ? parseWibDate(input.activeUntil) : null,
    isActive: input.isActive,
    sortOrder: input.sortOrder,
  };

  let savedId: string;
  try {
    savedId = await getDatabase().transaction(async (tx) => {
      if (input.id) {
        const [current] = await tx
          .select({ id: campaigns.id })
          .from(campaigns)
          .where(eq(campaigns.id, input.id))
          .limit(1);
        if (!current) return "";
        await tx
          .update(campaigns)
          .set({ ...values, updatedAt: new Date() })
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
      const [created] = await tx
        .insert(campaigns)
        .values(values)
        .returning({ id: campaigns.id });
      await tx.insert(auditLogs).values({
        adminId: profile.id,
        action: "create",
        entityType: "campaigns",
        entityId: created.id,
        changes: { fields: Object.keys(values) },
      });
      return created.id;
    });
  } catch {
    return { message: "Gagal menyimpan kampanye. Coba lagi.", errors: {} };
  }
  if (!savedId) return { message: "Kampanye tidak ditemukan.", errors: {} };

  revalidatePath("/");
  revalidatePath("/admin/campaigns");
  redirect(`/admin/campaigns/${savedId}?saved=1`);
}
