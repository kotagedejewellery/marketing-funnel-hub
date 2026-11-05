"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as z from "zod";

import { getDatabase } from "@/lib/db/client";
import { auditLogs, branches, pageBlocks } from "@/lib/db/schema";
import { requireAdmin } from "@/modules/admin/access";

import { createInitialPageBlocks } from "./page-blocks";

type ActionState = { message: string; ok?: boolean };

export async function initializePageBlocks(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireAdmin();
  const branchId = formData.get("branchId");
  if (typeof branchId !== "string" || !z.uuid().safeParse(branchId).success)
    return { message: "Halaman cabang tidak valid." };

  const db = getDatabase();
  const [branch] = await db
    .select({ id: branches.id, slug: branches.slug })
    .from(branches)
    .where(eq(branches.id, branchId))
    .limit(1);
  if (!branch) return { message: "Cabang tidak ditemukan." };

  try {
    const created = await db.transaction(async (tx) => {
      const initialized = await createInitialPageBlocks(tx, branchId);
      if (initialized) {
        await tx.insert(auditLogs).values({
          adminId: profile.id,
          action: "create",
          entityType: "page_blocks",
          entityId: branchId,
          changes: { initializedFromExistingPage: true },
        });
      }
      return initialized;
    });
    if (!created) return { message: "Susunan kustom sudah aktif." };
  } catch {
    return { message: "Susunan halaman gagal dibuat. Coba lagi." };
  }

  revalidatePath(`/${branch.slug}`);
  revalidatePath(`/admin/branches/${branchId}/link-bio`);
  return { message: "Susunan halaman kustom siap diatur.", ok: true };
}

export async function resetPageBlocks(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireAdmin();
  const branchId = formData.get("branchId");
  if (typeof branchId !== "string" || !z.uuid().safeParse(branchId).success)
    return { message: "Halaman cabang tidak valid." };

  const db = getDatabase();
  const [branch] = await db
    .select({ id: branches.id, slug: branches.slug })
    .from(branches)
    .where(eq(branches.id, branchId))
    .limit(1);
  if (!branch) return { message: "Cabang tidak ditemukan." };

  try {
    const deleted = await db.transaction(async (tx) => {
      const removed = await tx
        .delete(pageBlocks)
        .where(eq(pageBlocks.branchId, branchId))
        .returning({ id: pageBlocks.id });
      if (removed.length > 0) {
        await tx.insert(auditLogs).values({
          adminId: profile.id,
          action: "delete",
          entityType: "page_blocks",
          entityId: branchId,
          changes: { restoredTemplateLayout: true, blockCount: removed.length },
        });
      }
      return removed.length;
    });
    if (deleted === 0) return { message: "Susunan template sudah digunakan." };
  } catch {
    return { message: "Susunan template gagal dipulihkan. Coba lagi." };
  }

  revalidatePath(`/${branch.slug}`);
  revalidatePath(`/admin/branches/${branchId}/link-bio`);
  return { message: "Susunan template dipulihkan.", ok: true };
}
