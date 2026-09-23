"use server";

import { and, asc, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as z from "zod";

import { getDatabase } from "@/lib/db/client";
import {
  auditLogs,
  branches,
  campaigns,
  faqs,
  galleryItems,
  links,
} from "@/lib/db/schema";
import { requireAdmin } from "@/modules/admin/access";

type ActionState = { message: string; ok?: boolean };

const moveSchema = z
  .object({
    kind: z.enum(["link", "faq", "gallery", "campaign", "branch"]),
    id: z.uuid(),
    branchId: z.union([z.uuid(), z.literal("")]),
    direction: z.enum(["up", "down"]),
  })
  .superRefine(({ kind, branchId }, context) => {
    if (kind === "branch" && branchId) {
      context.addIssue({
        code: "custom",
        path: ["branchId"],
        message: "Pengurutan cabang tidak memakai scope cabang.",
      });
    }
    if (kind === "gallery" && !branchId) {
      context.addIssue({
        code: "custom",
        path: ["branchId"],
        message: "Galeri wajib memiliki scope cabang.",
      });
    }
  });

export async function movePageItem(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireAdmin();
  const parsed = moveSchema.safeParse({
    kind: formData.get("kind"),
    id: formData.get("id"),
    branchId: formData.get("branchId"),
    direction: formData.get("direction"),
  });
  if (!parsed.success) return { message: "Urutan tidak valid." };
  const { kind, id, branchId, direction } = parsed.data;
  const db = getDatabase();
  const branch = branchId
    ? (
        await db
          .select({ slug: branches.slug })
          .from(branches)
          .where(eq(branches.id, branchId))
          .limit(1)
      )[0]
    : null;
  if (branchId && !branch) return { message: "Cabang tidak ditemukan." };

  try {
    const moved = await db.transaction(async (tx) => {
      let rows: { id: string }[];
      if (kind === "link") {
        const scope = branchId
          ? eq(links.branchId, branchId)
          : isNull(links.branchId);
        const [target] = await tx
          .select({ linkType: links.linkType })
          .from(links)
          .where(and(eq(links.id, id), scope))
          .limit(1);
        rows = target
          ? await tx
              .select({ id: links.id })
              .from(links)
              .where(and(scope, eq(links.linkType, target.linkType)))
              .orderBy(asc(links.sortOrder), asc(links.id))
          : [];
      } else if (kind === "faq") {
        rows = await tx
          .select({ id: faqs.id })
          .from(faqs)
          .where(branchId ? eq(faqs.branchId, branchId) : isNull(faqs.branchId))
          .orderBy(asc(faqs.sortOrder), asc(faqs.id));
      } else if (kind === "gallery") {
        rows = branchId
          ? await tx
              .select({ id: galleryItems.id })
              .from(galleryItems)
              .where(eq(galleryItems.branchId, branchId))
              .orderBy(asc(galleryItems.sortOrder), asc(galleryItems.id))
          : [];
      } else if (kind === "campaign") {
        rows = await tx
          .select({ id: campaigns.id })
          .from(campaigns)
          .where(
            branchId
              ? eq(campaigns.branchId, branchId)
              : isNull(campaigns.branchId),
          )
          .orderBy(asc(campaigns.sortOrder), asc(campaigns.id));
      } else {
        rows = await tx
          .select({ id: branches.id })
          .from(branches)
          .orderBy(
            asc(branches.sortOrder),
            asc(branches.name),
            asc(branches.id),
          );
      }
      const index = rows.findIndex((row) => row.id === id);
      const other = direction === "up" ? index - 1 : index + 1;
      if (index < 0 || other < 0 || other >= rows.length) return false;
      [rows[index], rows[other]] = [rows[other], rows[index]];
      for (const [position, row] of rows.entries()) {
        if (kind === "link") {
          await tx
            .update(links)
            .set({ sortOrder: position, updatedAt: new Date() })
            .where(eq(links.id, row.id));
        } else if (kind === "faq") {
          await tx
            .update(faqs)
            .set({ sortOrder: position, updatedAt: new Date() })
            .where(eq(faqs.id, row.id));
        } else if (kind === "gallery") {
          await tx
            .update(galleryItems)
            .set({ sortOrder: position, updatedAt: new Date() })
            .where(eq(galleryItems.id, row.id));
        } else if (kind === "campaign") {
          await tx
            .update(campaigns)
            .set({ sortOrder: position, updatedAt: new Date() })
            .where(eq(campaigns.id, row.id));
        } else {
          await tx
            .update(branches)
            .set({ sortOrder: position, updatedAt: new Date() })
            .where(eq(branches.id, row.id));
        }
      }
      await tx.insert(auditLogs).values({
        adminId: profile.id,
        action: "update",
        entityType:
          kind === "link"
            ? "links"
            : kind === "faq"
              ? "faqs"
              : kind === "gallery"
                ? "gallery_items"
                : kind === "campaign"
                  ? "campaigns"
                  : "branches",
        entityId: id,
        changes: { field: "sortOrder", branchId: branchId || null },
      });
      return true;
    });
    if (!moved) return { message: "Posisi item tidak berubah." };
  } catch {
    return { message: "Urutan gagal disimpan. Coba lagi." };
  }

  if (kind === "branch") {
    revalidatePath("/");
    revalidatePath("/admin/link-bio");
  } else if (branch) {
    revalidatePath(`/${branch.slug}`);
    revalidatePath(`/admin/branches/${branchId}/link-bio`);
  } else {
    if (kind === "faq") {
      revalidatePath("/admin/settings");
      revalidatePath("/[slug]", "page");
    }
    if (kind === "link") revalidatePath("/admin/links");
    if (kind === "campaign") revalidatePath("/admin/campaigns");
  }
  return { message: "Urutan diperbarui.", ok: true };
}
