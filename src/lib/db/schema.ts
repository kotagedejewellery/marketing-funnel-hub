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

export const contentSections = pgTable("content_sections", {
  id: uuid("id").primaryKey().defaultRandom(),
  sectionKey: text("section_key").notNull().unique(),
  label: text("label").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}).enableRLS();

export const campaigns = pgTable(
  "campaigns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
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
