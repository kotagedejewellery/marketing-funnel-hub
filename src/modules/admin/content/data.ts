import "server-only";

import { asc, isNull } from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";
import { contentSections, faqs, siteSettings } from "@/lib/db/schema";
import { requireAdmin } from "@/modules/admin/access";
import {
  branchSectionKeys,
  branchSectionLabels,
} from "@/modules/admin/branches/page-validation";

export async function getContentSettings() {
  await requireAdmin();
  const db = getDatabase();
  const [settings, sections, faqRows] = await Promise.all([
    db.select().from(siteSettings).limit(1),
    db
      .select({
        id: contentSections.id,
        label: contentSections.label,
        sectionKey: contentSections.sectionKey,
        sortOrder: contentSections.sortOrder,
        isActive: contentSections.isActive,
      })
      .from(contentSections)
      .where(isNull(contentSections.branchId))
      .orderBy(asc(contentSections.sortOrder), asc(contentSections.id)),
    db
      .select()
      .from(faqs)
      .where(isNull(faqs.branchId))
      .orderBy(asc(faqs.sortOrder), asc(faqs.id)),
  ]);

  if (!settings[0]) throw new Error("Site settings are missing.");
  return {
    settings: settings[0],
    sections: sections.map((section) => {
      const sectionKey = branchSectionKeys.find(
        (candidate) => candidate === section.sectionKey,
      );
      return {
        ...section,
        label: sectionKey ? branchSectionLabels[sectionKey] : section.label,
      };
    }),
    faqs: faqRows,
  };
}
