import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const adminId = randomUUID();
vi.mock("@/modules/admin/access", () => ({
  requireAdmin: vi.fn(async () => ({ id: adminId })),
}));

import { getDatabase } from "@/lib/db/client";
import {
  adminProfiles,
  auditLogs,
  branches,
  branchGoogleReviews,
  branchMetaTrackingConfigs,
  branchPageBuilderLayouts,
  branchReviewSources,
  campaigns,
  contentSections,
  events,
  faqs,
  galleryItems,
  links,
  pageBlocks,
  productBranches,
  products,
} from "@/lib/db/schema";

import { deactivateBranch, deleteBranch } from "./actions";
import { getAllBranches } from "./data";

type Fixture = {
  branchId: string;
  productId: string;
  slug: string;
};

let fixture: Fixture | null = null;

async function createFixture({ pageView }: { pageView: boolean }) {
  const db = getDatabase();
  const branchId = randomUUID();
  const productId = randomUUID();
  const productBranchId = randomUUID();
  const linkId = randomUUID();
  const slug = `delete-test-${branchId.slice(0, 8)}`;

  await db.insert(adminProfiles).values({
    id: adminId,
    email: `delete-test-${adminId}@example.test`,
    role: "admin",
  });
  await db.insert(branches).values({
    id: branchId,
    name: "Cabang uji hapus",
    slug,
    whatsappNumber: "628123456789",
    sortOrder: 99_999,
  });
  await db.insert(products).values({
    id: productId,
    name: "Produk uji hapus",
    slug: `product-delete-${productId.slice(0, 8)}`,
    sortOrder: 99_999,
  });
  await db.insert(productBranches).values({
    id: productBranchId,
    branchId,
    productId,
    sortOrder: 0,
  });
  await db.insert(links).values({
    id: linkId,
    branchId,
    label: "Tautan uji",
    url: "https://example.test",
    linkType: "secondary",
    sortOrder: 0,
  });
  await db.insert(contentSections).values({
    branchId,
    sectionKey: "gallery",
    label: "Galeri",
    sortOrder: 0,
  });
  await db.insert(pageBlocks).values([
    {
      branchId,
      kind: "product",
      productBranchId,
      sortOrder: 0,
    },
    { branchId, kind: "link", linkId, sortOrder: 1 },
  ]);
  await db.insert(branchPageBuilderLayouts).values({ branchId });
  await db.insert(branchMetaTrackingConfigs).values({ branchId });
  await db.insert(galleryItems).values({
    branchId,
    imagePath: `gallery/${branchId}/test.webp`,
    altText: "Gambar uji",
    sortOrder: 0,
  });
  await db.insert(campaigns).values({
    id: randomUUID(),
    branchId,
    name: "Kampanye uji",
    sortOrder: 0,
  });
  await db.insert(faqs).values({
    branchId,
    question: "Pertanyaan uji",
    answer: "Jawaban uji",
    sortOrder: 0,
  });
  await db.insert(branchReviewSources).values({
    branchId,
    sourceUrl: "https://maps.app.goo.gl/test",
  });
  await db.insert(branchGoogleReviews).values({
    branchId,
    sourceHash: randomUUID(),
    reviewerName: "Pengulas uji",
    rating: 5,
    relativeTime: "baru saja",
    reviewText: "Ulasan uji",
    sourceUrl: "https://maps.app.goo.gl/test",
    sortOrder: 0,
  });
  if (pageView) {
    await db.insert(events).values({
      eventId: randomUUID(),
      anonymousSessionId: randomUUID(),
      eventName: "PageView",
      eventTime: new Date(),
      pageUrl: `http://127.0.0.1:3100/${slug}`,
    });
  }
  return { branchId, productId, slug };
}

async function clearFixture(value: Fixture | null) {
  if (!value) return;
  const db = getDatabase();
  await db.delete(pageBlocks).where(eq(pageBlocks.branchId, value.branchId));
  await db
    .delete(branchPageBuilderLayouts)
    .where(eq(branchPageBuilderLayouts.branchId, value.branchId));
  await db
    .delete(branchMetaTrackingConfigs)
    .where(eq(branchMetaTrackingConfigs.branchId, value.branchId));
  await db
    .delete(branchGoogleReviews)
    .where(eq(branchGoogleReviews.branchId, value.branchId));
  await db
    .delete(branchReviewSources)
    .where(eq(branchReviewSources.branchId, value.branchId));
  await db
    .delete(galleryItems)
    .where(eq(galleryItems.branchId, value.branchId));
  await db.delete(faqs).where(eq(faqs.branchId, value.branchId));
  await db.delete(campaigns).where(eq(campaigns.branchId, value.branchId));
  await db.delete(links).where(eq(links.branchId, value.branchId));
  await db
    .delete(contentSections)
    .where(eq(contentSections.branchId, value.branchId));
  await db
    .delete(productBranches)
    .where(eq(productBranches.branchId, value.branchId));
  await db
    .delete(events)
    .where(eq(events.pageUrl, `http://127.0.0.1:3100/${value.slug}`));
  await db.delete(branches).where(eq(branches.id, value.branchId));
  await db.delete(auditLogs).where(eq(auditLogs.adminId, adminId));
  await db.delete(products).where(eq(products.id, value.productId));
  await db.delete(adminProfiles).where(eq(adminProfiles.id, adminId));
}

beforeEach(async () => {
  await clearFixture(fixture);
  fixture = null;
});

afterEach(async () => {
  await clearFixture(fixture);
  fixture = null;
});

describe("branch deletion and deactivation", () => {
  it("keeps a page when its public URL already has a PageView", async () => {
    fixture = await createFixture({ pageView: true });
    const formData = new FormData();
    formData.set("id", fixture.branchId);
    formData.set("confirmationSlug", fixture.slug);

    const result = await deleteBranch({ message: "", errors: {} }, formData);

    expect(result.ok).not.toBe(true);
    expect(result.message).toMatch(/tracking/i);
    const page = (await getAllBranches()).find(
      (branch) => branch.id === fixture?.branchId,
    );
    expect(page?.deletionBlockReason).toMatch(/tracking/i);
    const [remaining] = await getDatabase()
      .select({ id: branches.id })
      .from(branches)
      .where(eq(branches.id, fixture.branchId));
    expect(remaining).toBeTruthy();
  });

  it("removes every branch-owned row when a test page has no history", async () => {
    fixture = await createFixture({ pageView: false });
    const formData = new FormData();
    formData.set("id", fixture.branchId);
    formData.set("confirmationSlug", fixture.slug);

    const result = await deleteBranch({ message: "", errors: {} }, formData);

    expect(result.ok).toBe(true);
    const [remaining] = await getDatabase()
      .select({ id: branches.id })
      .from(branches)
      .where(eq(branches.id, fixture.branchId));
    expect(remaining).toBeUndefined();
  });

  it("deactivates a historical non-default page instead of deleting it", async () => {
    fixture = await createFixture({ pageView: true });
    const formData = new FormData();
    formData.set("id", fixture.branchId);

    const result = await deactivateBranch(
      { message: "", errors: {} },
      formData,
    );

    expect(result.ok).toBe(true);
    const [remaining] = await getDatabase()
      .select({ isActive: branches.isActive })
      .from(branches)
      .where(eq(branches.id, fixture.branchId));
    expect(remaining?.isActive).toBe(false);
  });
});
