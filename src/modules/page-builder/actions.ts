"use server";

import { randomUUID } from "node:crypto";

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
import { deletePublicAsset, uploadPublicAsset } from "@/lib/media/server";
import {
  imageExtension,
  maxImageBytes,
} from "@/modules/admin/media/validation";

import {
  pageBuilderBlocksSchema,
  pageBuilderPublishBlocksSchema,
  sanitizePageBuilderHtml,
} from "./schema";
import { isOwnedBuilderImagePath, releasedBuilderImagePaths } from "./media";

type ActionResult =
  | { ok: true; message: string; revision: number }
  | { ok: false; message: string; conflict?: true };
export type PageBuilderImageUploadState =
  { ok: false; message: string } | { ok: true; message: string; path: string };
type BuilderInput = {
  branch: { id: string; slug: string };
  blocks: ReturnType<typeof pageBuilderBlocksSchema.parse>;
};

export async function uploadPageBuilderImage(
  _previous: PageBuilderImageUploadState,
  formData: FormData,
): Promise<PageBuilderImageUploadState> {
  const profile = await requireAdmin();
  const branchId = formData.get("branchId");
  const file = formData.get("file");
  if (typeof branchId !== "string" || !/^[0-9a-f-]{36}$/i.test(branchId)) {
    return { ok: false, message: "Tujuan gambar tidak valid." };
  }
  if (!(file instanceof File) || file.size === 0 || file.size > maxImageBytes) {
    return { ok: false, message: "Pilih gambar maksimal 5 MB." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const extension = imageExtension(file.type, bytes);
  if (!extension) {
    return {
      ok: false,
      message: "Gunakan gambar JPEG, PNG, atau WebP yang valid.",
    };
  }
  const [branch] = await getDatabase()
    .select({ id: branches.id })
    .from(branches)
    .where(eq(branches.id, branchId))
    .limit(1);
  if (!branch) return { ok: false, message: "Cabang halaman tidak ditemukan." };

  const path = `builder/${branchId}/${randomUUID()}.${extension}`;
  try {
    await uploadPublicAsset(path, bytes);
  } catch {
    return { ok: false, message: "Unggah gambar gagal. Coba lagi." };
  }
  try {
    await getDatabase()
      .insert(auditLogs)
      .values({
        adminId: profile.id,
        action: "update",
        entityType: "branch_page_builder",
        entityId: branchId,
        changes: { field: "image", mode: "upload" },
      });
  } catch {
    await deletePublicAsset(path).catch(() => undefined);
    return { ok: false, message: "Unggah gambar gagal. Coba lagi." };
  }
  return { ok: true, message: "Gambar berhasil diunggah.", path };
}

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
  if (
    parsed.data.some(
      (block) =>
        block.type === "image" &&
        block.path &&
        !isOwnedBuilderImagePath(block.path, branchId),
    )
  ) {
    return { message: "Gambar tidak dimiliki cabang ini." };
  }

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

async function savedBuilderBlocks(branchId: string) {
  const [layout] = await getDatabase()
    .select({
      draftBlocks: branchPageBuilderLayouts.draftBlocks,
      publishedBlocks: branchPageBuilderLayouts.publishedBlocks,
    })
    .from(branchPageBuilderLayouts)
    .where(eq(branchPageBuilderLayouts.branchId, branchId))
    .limit(1);
  return {
    draft: pageBuilderBlocksSchema.safeParse(layout?.draftBlocks).data ?? [],
    published:
      pageBuilderBlocksSchema.safeParse(layout?.publishedBlocks).data ?? [],
  };
}

async function deleteReleasedBuilderImages(
  input: Parameters<typeof releasedBuilderImagePaths>[0],
) {
  await Promise.allSettled(
    releasedBuilderImagePaths(input).map((path) => deletePublicAsset(path)),
  );
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
  if (result.input.blocks.length === 0) {
    return {
      ok: false,
      message: "Tambahkan minimal satu blok sebelum menerbitkan.",
    };
  }
  const previous = await savedBuilderBlocks(branchId);
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
  await deleteReleasedBuilderImages({
    branchId,
    previousDraft: previous.draft,
    previousPublished: previous.published,
    nextDraft: result.input.blocks,
    nextPublished: result.input.blocks,
  });
  revalidatePath(`/${result.input.branch.slug}`);
  revalidatePath(`/admin/branches/${branchId}/link-bio`);
  return {
    ok: true,
    message: "Halaman builder diterbitkan.",
    revision: layout.revision,
  };
}
