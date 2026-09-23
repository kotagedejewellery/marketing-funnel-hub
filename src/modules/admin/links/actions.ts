"use server";

import { and, eq, isNull, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDatabase } from "@/lib/db/client";
import { auditLogs, branches, links } from "@/lib/db/schema";
import { requireAdmin } from "@/modules/admin/access";

import { linkSchema } from "./validation";

type ActionState = {
  message: string;
  errors: Record<string, string>;
  ok?: boolean;
};

export async function saveLink(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireAdmin();
  const parsed = linkSchema.safeParse({
    ...Object.fromEntries(formData),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) {
    return {
      message: "Periksa kembali isian tautan.",
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
    label: input.label,
    url: input.url,
    linkType: input.linkType,
    platform: input.platform,
    iconKey: input.iconKey,
    isActive: input.isActive,
  };

  let savedId: string;
  try {
    savedId = await getDatabase().transaction(async (tx) => {
      if (input.id) {
        const [current] = await tx
          .select({
            id: links.id,
            branchId: links.branchId,
            sortOrder: links.sortOrder,
          })
          .from(links)
          .where(eq(links.id, input.id))
          .limit(1);
        if (!current || current.branchId !== branchId) return "";
        await tx
          .update(links)
          .set({
            ...values,
            sortOrder: current.sortOrder,
            updatedAt: new Date(),
          })
          .where(eq(links.id, input.id));
        await tx.insert(auditLogs).values({
          adminId: profile.id,
          action: "update",
          entityType: "links",
          entityId: input.id,
          changes: { fields: Object.keys(values) },
        });
        return input.id;
      }
      const scope = branchId
        ? eq(links.branchId, branchId)
        : isNull(links.branchId);
      const [lastOrder] = await tx
        .select({ value: max(links.sortOrder) })
        .from(links)
        .where(and(scope, eq(links.linkType, input.linkType)));
      const createValues = {
        ...values,
        sortOrder: Number(lastOrder?.value ?? -1) + 1,
      };
      const [created] = await tx
        .insert(links)
        .values(createValues)
        .returning({ id: links.id });
      await tx.insert(auditLogs).values({
        adminId: profile.id,
        action: "create",
        entityType: "links",
        entityId: created.id,
        changes: { fields: Object.keys(createValues) },
      });
      return created.id;
    });
  } catch {
    return { message: "Gagal menyimpan tautan. Coba lagi.", errors: {} };
  }
  if (!savedId) return { message: "Tautan tidak ditemukan.", errors: {} };

  if (branch) revalidatePath(`/${branch.slug}`);
  if (branchId) revalidatePath(`/admin/branches/${branchId}/link-bio`);
  revalidatePath("/admin/links");
  if (formData.get("stayOnPage") === "1") {
    return { message: "Tautan berhasil disimpan.", errors: {}, ok: true };
  }
  redirect(
    branchId
      ? `/admin/branches/${branchId}/link-bio?saved=1`
      : "/admin/links?saved=1",
  );
}
