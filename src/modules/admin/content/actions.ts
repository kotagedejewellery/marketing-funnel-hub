"use server";

import { and, asc, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDatabase } from "@/lib/db/client";
import { auditLogs, contentSections, siteSettings } from "@/lib/db/schema";
import { requireAdmin } from "@/modules/admin/access";

import { sectionActionSchema, settingsSchema } from "./validation";

type ActionState = {
  message: string;
  errors: Record<string, string>;
  ok?: boolean;
};

export async function saveSiteSettings(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireAdmin();
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      message: "Periksa kembali isian yang ditandai.",
      errors: Object.fromEntries(
        parsed.error.issues.map((issue) => [
          String(issue.path[0]),
          issue.message,
        ]),
      ),
    };
  }

  const input = parsed.data;
  const db = getDatabase();
  let changed: boolean;
  try {
    changed = await db.transaction(async (tx) => {
      const [current] = await tx.select().from(siteSettings).limit(1);
      if (!current) throw new Error("Site settings are missing.");
      const fields = Object.keys(input).filter(
        (key) =>
          current[key as keyof typeof input] !==
          input[key as keyof typeof input],
      );
      if (fields.length === 0) return false;

      await tx
        .update(siteSettings)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(siteSettings.id, current.id));
      await tx.insert(auditLogs).values({
        adminId: profile.id,
        action: "update",
        entityType: "site_settings",
        entityId: current.id,
        changes: { fields },
      });
      return true;
    });
  } catch {
    return { message: "Gagal menyimpan pengaturan. Coba lagi.", errors: {} };
  }

  if (changed) {
    revalidatePath("/");
    revalidatePath("/admin/settings");
  }
  return {
    message: changed ? "Pengaturan tersimpan." : "Tidak ada perubahan.",
    errors: {},
    ok: true,
  };
}

export async function changeContentSection(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireAdmin();
  const parsed = sectionActionSchema.safeParse({
    id: formData.get("id"),
    operation: formData.get("operation"),
  });
  if (!parsed.success) {
    return { message: "Perubahan section tidak valid.", errors: {} };
  }

  const { id, operation } = parsed.data;
  const db = getDatabase();
  let changed: boolean;
  try {
    changed = await db.transaction(async (tx) => {
      const sections = await tx
        .select({
          id: contentSections.id,
          sortOrder: contentSections.sortOrder,
          isActive: contentSections.isActive,
        })
        .from(contentSections)
        .where(isNull(contentSections.branchId))
        .orderBy(asc(contentSections.sortOrder), asc(contentSections.id));
      const index = sections.findIndex((section) => section.id === id);
      if (index < 0) return false;

      if (operation === "activate" || operation === "deactivate") {
        const isActive = operation === "activate";
        if (sections[index].isActive === isActive) return false;
        await tx
          .update(contentSections)
          .set({ isActive, updatedAt: new Date() })
          .where(
            and(eq(contentSections.id, id), isNull(contentSections.branchId)),
          );
        await tx.insert(auditLogs).values({
          adminId: profile.id,
          action: isActive ? "activate" : "deactivate",
          entityType: "content_sections",
          entityId: id,
          changes: { isActive },
        });
        return true;
      }

      const destination = index + (operation === "up" ? -1 : 1);
      if (destination < 0 || destination >= sections.length) return false;
      const [moved] = sections.splice(index, 1);
      sections.splice(destination, 0, moved);
      for (const [position, section] of sections.entries()) {
        await tx
          .update(contentSections)
          .set({ sortOrder: position * 10, updatedAt: new Date() })
          .where(
            and(
              eq(contentSections.id, section.id),
              isNull(contentSections.branchId),
            ),
          );
      }
      await tx.insert(auditLogs).values({
        adminId: profile.id,
        action: "update",
        entityType: "content_sections",
        entityId: id,
        changes: { order: { from: index, to: destination } },
      });
      return true;
    });
  } catch {
    return { message: "Gagal memperbarui section. Coba lagi.", errors: {} };
  }

  if (changed) {
    revalidatePath("/");
    revalidatePath("/admin/content");
  }
  return {
    message: changed ? "Section diperbarui." : "Tidak ada perubahan.",
    errors: {},
    ok: true,
  };
}
