import "server-only";

import { asc } from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";
import { contentSections, siteSettings } from "@/lib/db/schema";
import { requireAdmin } from "@/modules/admin/access";

export async function getContentSettings() {
  await requireAdmin();
  const db = getDatabase();
  const [settings, sections] = await Promise.all([
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
      .orderBy(asc(contentSections.sortOrder), asc(contentSections.id)),
  ]);

  if (!settings[0]) throw new Error("Site settings are missing.");
  return { settings: settings[0], sections };
}
