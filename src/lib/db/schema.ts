import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const singletonId = "00000000-0000-0000-0000-000000000001";

export const adminProfiles = pgTable(
  "admin_profiles",
  {
    id: uuid("id").primaryKey(),
    displayName: text("display_name"),
    role: text("role").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "admin_profiles_role_check",
      sql`${table.role} in ('admin', 'technical_admin')`,
    ),
  ],
).enableRLS();

export const siteSettings = pgTable(
  "site_settings",
  {
    id: uuid("id").primaryKey().default(singletonId),
    siteName: text("site_name").notNull().default("KGJ"),
    headline: text("headline"),
    introduction: text("introduction"),
    logoPath: text("logo_path"),
    defaultWhatsappMessage: text("default_whatsapp_message").notNull(),
    defaultCtaLabel: text("default_cta_label").notNull(),
    privacyUrl: text("privacy_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "site_settings_singleton_check",
      sql`${table.id} = '00000000-0000-0000-0000-000000000001'::uuid`,
    ),
  ],
).enableRLS();

export const contentSections = pgTable(
  "content_sections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    branchId: uuid("branch_id").references(() => branches.id, {
      onDelete: "restrict",
    }),
    sectionKey: text("section_key").notNull(),
    label: text("label").notNull(),
    publicTitle: text("public_title"),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("content_sections_global_key_unique")
      .on(table.sectionKey)
      .where(sql`${table.branchId} is null`),
    uniqueIndex("content_sections_branch_key_unique")
      .on(table.branchId, table.sectionKey)
      .where(sql`${table.branchId} is not null`),
  ],
).enableRLS();

export const campaigns = pgTable(
  "campaigns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    branchId: uuid("branch_id").references(() => branches.id, {
      onDelete: "restrict",
    }),
    name: text("name").notNull(),
    title: text("title"),
    description: text("description"),
    bannerPath: text("banner_path"),
    targetUrl: text("target_url"),
    activeFrom: timestamp("active_from", { withTimezone: true }),
    activeUntil: timestamp("active_until", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "campaigns_date_range_check",
      sql`${table.activeUntil} is null or ${table.activeFrom} is null or ${table.activeUntil} > ${table.activeFrom}`,
    ),
    index("campaigns_visibility_idx").on(
      table.isActive,
      table.sortOrder,
      table.activeFrom.desc(),
    ),
    index("campaigns_branch_visibility_idx").on(
      table.branchId,
      table.isActive,
      table.sortOrder,
      table.activeFrom.desc(),
    ),
  ],
).enableRLS();

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    imagePath: text("image_path"),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("products_active_sort_idx").on(table.isActive, table.sortOrder),
  ],
).enableRLS();

export const branches = pgTable(
  "branches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    whatsappNumber: text("whatsapp_number").notNull(),
    ctaLabel: text("cta_label"),
    headline: text("headline"),
    introduction: text("introduction"),
    logoPath: text("logo_path"),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "branches_whatsapp_number_check",
      sql`${table.whatsappNumber} ~ '^[1-9][0-9]{7,14}$'`,
    ),
  ],
).enableRLS();

export const productBranches = pgTable(
  "product_branches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    branchId: uuid("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "restrict" }),
    displayName: text("display_name"),
    description: text("description"),
    imagePath: text("image_path"),
    showImage: boolean("show_image").notNull().default(true),
    whatsappMessageTemplate: text("whatsapp_message_template"),
    ctaLabel: text("cta_label"),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("product_branches_product_branch_unique").on(
      table.productId,
      table.branchId,
    ),
  ],
).enableRLS();

export const links = pgTable(
  "links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    branchId: uuid("branch_id").references(() => branches.id, {
      onDelete: "restrict",
    }),
    label: text("label").notNull(),
    url: text("url").notNull(),
    linkType: text("link_type").notNull(),
    platform: text("platform"),
    iconKey: text("icon_key"),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "links_type_check",
      sql`${table.linkType} in ('secondary', 'social')`,
    ),
    index("links_branch_sort_idx").on(table.branchId, table.sortOrder),
  ],
).enableRLS();

export const galleryItems = pgTable(
  "gallery_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    branchId: uuid("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "restrict" }),
    imagePath: text("image_path").notNull(),
    title: text("title"),
    description: text("description"),
    altText: text("alt_text").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("gallery_items_branch_visibility_idx").on(
      table.branchId,
      table.isActive,
      table.sortOrder,
    ),
  ],
).enableRLS();

export const branchReviewSources = pgTable(
  "branch_review_sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    branchId: uuid("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "restrict" })
      .unique(),
    sourceUrl: text("source_url").notNull(),
    isEnabled: boolean("is_enabled").notNull().default(false),
    minimumRating: integer("minimum_rating").notNull().default(1),
    maximumReviews: integer("maximum_reviews").notNull().default(6),
    displayMode: text("display_mode").notNull().default("automatic"),
    lastScrapedAt: timestamp("last_scraped_at", { withTimezone: true }),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "branch_review_sources_minimum_rating_check",
      sql`${table.minimumRating} between 1 and 5`,
    ),
    check(
      "branch_review_sources_maximum_reviews_check",
      sql`${table.maximumReviews} between 1 and 12`,
    ),
    check(
      "branch_review_sources_display_mode_check",
      sql`${table.displayMode} in ('automatic', 'manual')`,
    ),
  ],
).enableRLS();

export const branchGoogleReviews = pgTable(
  "branch_google_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    branchId: uuid("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "restrict" }),
    sourceHash: text("source_hash").notNull(),
    reviewerName: text("reviewer_name").notNull(),
    reviewerPhotoUrl: text("reviewer_photo_url"),
    reviewerReviewCount: integer("reviewer_review_count"),
    rating: integer("rating").notNull(),
    relativeTime: text("relative_time").notNull(),
    reviewText: text("review_text").notNull(),
    sourceUrl: text("source_url").notNull(),
    isSelected: boolean("is_selected").notNull().default(false),
    isHidden: boolean("is_hidden").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("branch_google_reviews_branch_source_hash_unique").on(
      table.branchId,
      table.sourceHash,
    ),
    check(
      "branch_google_reviews_rating_check",
      sql`${table.rating} between 1 and 5`,
    ),
    check(
      "branch_google_reviews_reviewer_count_check",
      sql`${table.reviewerReviewCount} is null or ${table.reviewerReviewCount} >= 0`,
    ),
    index("branch_google_reviews_visibility_idx").on(
      table.branchId,
      table.isHidden,
      table.rating,
      table.sortOrder,
    ),
  ],
).enableRLS();

export const faqs = pgTable(
  "faqs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    branchId: uuid("branch_id").references(() => branches.id, {
      onDelete: "restrict",
    }),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("faqs_branch_sort_idx").on(table.branchId, table.sortOrder),
  ],
).enableRLS();

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: text("event_id").notNull().unique(),
    anonymousSessionId: text("anonymous_session_id").notNull(),
    eventName: text("event_name").notNull(),
    eventTime: timestamp("event_time", { withTimezone: true }).notNull(),
    pageUrl: text("page_url"),
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "restrict",
    }),
    branchId: uuid("branch_id").references(() => branches.id, {
      onDelete: "restrict",
    }),
    productCategory: text("product_category"),
    branchName: text("branch_name"),
    cta: text("cta"),
    source: text("source"),
    campaign: text("campaign"),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    utmContent: text("utm_content"),
    utmTerm: text("utm_term"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "events_context_check",
      sql`(
        (${table.eventName} = 'PageView' and ${table.productId} is null and ${table.productCategory} is null and ${table.branchId} is null and ${table.branchName} is null and ${table.cta} is null)
        or (${table.eventName} = 'ViewContent' and ${table.productId} is not null and ${table.productCategory} is not null and ${table.branchId} is null and ${table.branchName} is null and ${table.cta} is null)
        or (${table.eventName} = 'Contact' and ${table.productId} is not null and ${table.productCategory} is not null and ${table.branchId} is not null and ${table.branchName} is not null and ${table.cta} = 'whatsapp')
      )`,
    ),
    index("events_time_idx").on(table.eventTime.desc()),
    index("events_name_time_idx").on(table.eventName, table.eventTime.desc()),
    index("events_session_time_idx").on(
      table.anonymousSessionId,
      table.eventTime,
    ),
    index("events_product_time_idx").on(
      table.productId,
      table.eventTime.desc(),
    ),
    index("events_branch_time_idx").on(table.branchId, table.eventTime.desc()),
    index("events_utm_campaign_time_idx").on(
      table.utmCampaign,
      table.eventTime.desc(),
    ),
    index("events_utm_source_time_idx").on(
      table.utmSource,
      table.eventTime.desc(),
    ),
  ],
).enableRLS();

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  adminId: uuid("admin_id").references(() => adminProfiles.id, {
    onDelete: "restrict",
  }),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id"),
  changes: jsonb("changes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}).enableRLS();
