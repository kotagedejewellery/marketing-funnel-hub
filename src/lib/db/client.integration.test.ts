import { sql } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createDatabaseClient } from "./client";

describe("Drizzle database client", () => {
  it("rejects invalid configuration without revealing the supplied URL", () => {
    const invalid = "https://user:do-not-log-this@example.com/database";

    expect(() => createDatabaseClient(invalid)).toThrow("DATABASE_URL");
    try {
      createDatabaseClient(invalid);
    } catch (error) {
      expect(String(error)).not.toContain("do-not-log-this");
    }
  });

  it("connects to the local PostgreSQL database through Drizzle", async () => {
    const connection = createDatabaseClient(process.env.DATABASE_URL);

    try {
      const rows = await connection.db.execute(sql`select 1 as connected`);
      expect(rows[0]?.connected).toBe(1);
    } finally {
      await connection.close();
    }
  });

  it("has the ten approved P0 tables and approved extension tables", async () => {
    const connection = createDatabaseClient(process.env.DATABASE_URL);

    try {
      const rows = await connection.db.execute(sql`
        select count(*)::int as table_count
        from pg_tables
        where schemaname = 'public'
          and tablename in (
            'admin_profiles', 'site_settings', 'content_sections', 'campaigns',
            'products', 'branches', 'product_branches', 'links', 'faqs',
            'gallery_items',
            'events', 'audit_logs'
          )
      `);
      expect(rows[0]?.table_count).toBe(12);
    } finally {
      await connection.close();
    }
  });

  it("enables RLS and denies direct browser-role reads", async () => {
    const connection = createDatabaseClient(process.env.DATABASE_URL);

    try {
      const rows = await connection.db.execute(sql`
        select count(*)::int as protected_tables
        from pg_class as table_info
        join pg_namespace as schema_info on schema_info.oid = table_info.relnamespace
        where schema_info.nspname = 'public'
          and table_info.relkind = 'r'
          and table_info.relrowsecurity
          and not has_table_privilege('anon', table_info.oid, 'SELECT')
          and not has_table_privilege('authenticated', table_info.oid, 'SELECT')
      `);
      expect(rows[0]?.protected_tables).toBe(12);
    } finally {
      await connection.close();
    }
  });
});
