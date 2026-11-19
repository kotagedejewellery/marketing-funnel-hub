"use server";

import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDatabase } from "@/lib/db/client";
import {
  auditLogs,
  branches,
  branchPageBuilderLayouts,
  contentSections,
  links,
  productBranches,
  products as productCatalog,
} from "@/lib/db/schema";
import { requireAdmin } from "@/modules/admin/access";

import {
  pageBuilderBlocksSchema,
  pageBuilderPublishBlocksSchema,
  sanitizePageBuilderHtml,
} from "./schema";

type ActionResult =
  | { ok: true; message: string; revision: number }
  | { ok: false; message: string; conflict?: true };
type BuilderInput = {
  branch: { id: string; slug: string };
  blocks: ReturnType<typeof pageBuilderBlocksSchema.parse>;
};

async function readInput(
  branchId: string,
  blocks: unknown,
): Promise<{ input: BuilderInput } | { message: string }> {
  const parsed = pageBuilderBlocksSchema.safeParse(blocks);
  if (!parsed.success) {
    return {
      message: parsed.error.issues[0]?.message ?? "Draft halaman tidak valid.",
    };
  }

  const db = getDatabase();
  const [branch] = await db
    .select({ id: branches.id, slug: branches.slug })
    .from(branches)
    .where(eq(branches.id, branchId))
    .limit(1);
  if (!branch) return { message: "Cabang halaman tidak ditemukan." };

  const productIds = [
    ...new Set(
      parsed.data.flatMap((block) =>
        block.type === "product_cta" || block.type === "form"
          ? [block.assignmentId]
          : [],
      ),
    ),
  ];
  const linkIds = [
    ...new Set(
      parsed.data.flatMap((block) =>
        block.type === "link" ? [block.linkId] : [],
      ),
    ),
  ];
  const sectionKeys = [
    ...new Set(
      parsed.data.flatMap((block) =>
        block.type === "section" ? [block.sectionKey] : [],
      ),
    ),
  ];
  const [products, branchLinks, scopedSections] = await Promise.all([
    productIds.length
      ? db
          .select({ id: productBranches.id })
          .from(productBranches)
          .innerJoin(
            productCatalog,
            eq(productCatalog.id, productBranches.productId),
          )
          .where(
            and(
              eq(productBranches.branchId, branchId),
              inArray(productBranches.id, productIds),
              eq(productBranches.isActive, true),
              eq(productCatalog.isActive, true),
            ),
          )
      : [],
    linkIds.length
      ? db
          .select({ id: links.id })
          .from(links)
          .where(
            and(
              eq(links.branchId, branchId),
              inArray(links.id, linkIds),
              eq(links.isActive, true),
            ),
          )
      : [],
    db
      .select({ sectionKey: contentSections.sectionKey })
      .from(contentSections)
      .where(
        and(
          eq(contentSections.branchId, branchId),
          eq(contentSections.isActive, true),
        ),
      )
      .orderBy(asc(contentSections.sortOrder), asc(contentSections.id)),
  ]);
  const sections = scopedSections.length
    ? scopedSections
    : await db
        .select({ sectionKey: contentSections.sectionKey })
        .from(contentSections)
        .where(
          and(
            isNull(contentSections.branchId),
            eq(contentSections.isActive, true),
          ),
        )
        .orderBy(asc(contentSections.sortOrder), asc(contentSections.id));

  if (
    products.length !== productIds.length ||
    branchLinks.length !== linkIds.length ||
    !sectionKeys.every((key) =>
      sections.some((section) => section.sectionKey === key),
    )
  ) {
    return { message: "Referensi blok tidak tersedia untuk cabang ini." };
  }

  return {
    input: {
      branch,
      blocks: parsed.data.map((block) =>
        block.type === "html"
          ? { ...block, html: sanitizePageBuilderHtml(block.html) }
          : block,
      ),
    },
  };
}

export async function savePageBuilderDraft(
  branchId: string,
  blocks: unknown,
  expectedRevision: number | null = null,
): Promise<ActionResult> {
  const profile = await requireAdmin();
  const result = await readInput(branchId, blocks);
  if ("message" in result) return { ok: false, message: result.message };

  const db = getDatabase();
  const layout = await db.transaction(async (tx) => {
    const updatedAt = new Date();
    const rows =
      expectedRevision === null
        ? await tx
            .insert(branchPageBuilderLayouts)
            .values({ branchId, draftBlocks: result.input.blocks, revision: 0 })
            .onConflictDoNothing()
            .returning({ revision: branchPageBuilderLayouts.revision })
        : await tx
            .update(branchPageBuilderLayouts)
            .set({
              draftBlocks: result.input.blocks,
              revision: sql`${branchPageBuilderLayouts.revision} + 1`,
              updatedAt,
            })
            .where(
              and(
                eq(branchPageBuilderLayouts.branchId, branchId),
                eq(branchPageBuilderLayouts.revision, expectedRevision),
              ),
            )
            .returning({ revision: branchPageBuilderLayouts.revision });
    const [layout] = rows;
    if (!layout) return null;
    await tx.insert(auditLogs).values({
      adminId: profile.id,
      action: "update",
      entityType: "branch_page_builder",
      entityId: branchId,
      changes: { draftBlockCount: result.input.blocks.length },
    });
    return layout;
  });
  if (!layout)
    return {
      ok: false,
      conflict: true,
      message: "Halaman telah diubah oleh editor lain. Muat versi terbaru.",
    };
  revalidatePath(`/admin/branches/${branchId}/link-bio`);
  return {
    ok: true,
    message: "Draft builder tersimpan.",
    revision: layout.revision,
  };
}

export async function publishPageBuilder(
  branchId: string,
  blocks: unknown,
  expectedRevision: number | null = null,
): Promise<ActionResult> {
  const profile = await requireAdmin();
  const result = await readInput(branchId, blocks);
  if ("message" in result) return { ok: false, message: result.message };
  const publishable = pageBuilderPublishBlocksSchema.safeParse(
    result.input.blocks,
  );
  if (!publishable.success) {
    return {
      ok: false,
      message:
        publishable.error.issues[0]?.message ??
        "Halaman belum siap diterbitkan.",
    };
  }
  if (
    result.input.blocks.length === 0 ||
    !result.input.blocks.some(
      (block) => block.type === "product_cta" && block.isVisible,
    )
  ) {
    return {
      ok: false,
      message: "Terbitkan minimal satu CTA WhatsApp produk yang tampil.",
    };
  }

  const db = getDatabase();
  const layout = await db.transaction(async (tx) => {
    const now = new Date();
    const rows =
      expectedRevision === null
        ? await tx
            .insert(branchPageBuilderLayouts)
            .values({
              branchId,
              draftBlocks: result.input.blocks,
              publishedBlocks: result.input.blocks,
              isPublished: true,
              publishedAt: now,
              revision: 0,
            })
            .onConflictDoNothing()
            .returning({ revision: branchPageBuilderLayouts.revision })
        : await tx
            .update(branchPageBuilderLayouts)
            .set({
              draftBlocks: result.input.blocks,
              publishedBlocks: result.input.blocks,
              isPublished: true,
              publishedAt: now,
              revision: sql`${branchPageBuilderLayouts.revision} + 1`,
              updatedAt: now,
            })
            .where(
              and(
                eq(branchPageBuilderLayouts.branchId, branchId),
                eq(branchPageBuilderLayouts.revision, expectedRevision),
              ),
            )
            .returning({ revision: branchPageBuilderLayouts.revision });
    const [layout] = rows;
    if (!layout) return null;
    await tx.insert(auditLogs).values({
      adminId: profile.id,
      action: "update",
      entityType: "branch_page_builder",
      entityId: branchId,
      changes: { publishedBlockCount: result.input.blocks.length },
    });
    return layout;
  });
  if (!layout)
    return {
      ok: false,
      conflict: true,
      message: "Halaman telah diubah oleh editor lain. Muat versi terbaru.",
    };
  revalidatePath(`/${result.input.branch.slug}`);
  revalidatePath(`/admin/branches/${branchId}/link-bio`);
  return {
    ok: true,
    message: "Halaman builder diterbitkan.",
    revision: layout.revision,
  };
}
