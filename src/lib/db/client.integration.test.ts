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
    const connection = createDatabaseClient(process.env.DATABASE_URL, false);

    try {
      const rows = await connection.db.execute(sql`select 1 as connected`);
      expect(rows[0]?.connected).toBe(1);
    } finally {
      await connection.close();
    }
  });

  it("has the domain tables and internal admin-session table", async () => {
    const connection = createDatabaseClient(process.env.DATABASE_URL, false);

    try {
      const rows = await connection.db.execute(sql`
        select count(*)::int as table_count
        from pg_tables
        where schemaname = 'public'
          and tablename in (
            'admin_profiles', 'site_settings', 'content_sections', 'campaigns',
            'products', 'branches', 'product_branches', 'links', 'faqs',
            'gallery_items', 'branch_review_sources', 'branch_google_reviews',
            'branch_meta_tracking_configs', 'events', 'audit_logs',
            'admin_sessions'
          )
      `);
      expect(rows[0]?.table_count).toBe(16);
    } finally {
      await connection.close();
    }
  });

  it("enables RLS and grants access only through the application policy", async () => {
    const connection = createDatabaseClient(process.env.DATABASE_URL, false);

    try {
      const rows = await connection.db.execute(sql`
        select count(*)::int as protected_tables
        from pg_class as table_info
        join pg_namespace as schema_info on schema_info.oid = table_info.relnamespace
        where schema_info.nspname = 'public'
          and table_info.relkind = 'r'
          and table_info.relrowsecurity
          and exists (
            select 1
            from pg_policies as policy_info
            where policy_info.schemaname = 'public'
              and policy_info.tablename = table_info.relname
              and policy_info.policyname = 'kgj_app_access'
              and 'kgj_app' = any(policy_info.roles)
          )
          and (
            select count(distinct privilege_info.privilege_type)
            from aclexplode(
              coalesce(table_info.relacl, acldefault('r', table_info.relowner))
            ) as privilege_info
            where privilege_info.grantee = (
              select oid from pg_roles where rolname = 'kgj_app'
            )
              and privilege_info.privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
          ) = 4
          and not exists (
            select 1
            from aclexplode(
              coalesce(table_info.relacl, acldefault('r', table_info.relowner))
            ) as public_privilege
            where public_privilege.grantee = 0
              and public_privilege.privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
          )
          and table_info.relname in (
            'admin_profiles', 'admin_sessions', 'site_settings', 'content_sections',
            'campaigns', 'products', 'branches', 'product_branches', 'links',
            'faqs', 'gallery_items', 'branch_review_sources', 'branch_google_reviews',
            'branch_meta_tracking_configs', 'events', 'audit_logs'
          )
      `);
      expect(rows[0]?.protected_tables).toBe(16);
    } finally {
      await connection.close();
    }
  });

  it("restricts Meta page-load configuration to PageView", async () => {
    const connection = createDatabaseClient(process.env.DATABASE_URL, false);

    try {
      const rows = await connection.db.execute(sql`
        select pg_get_constraintdef(constraint_info.oid) as definition
        from pg_constraint as constraint_info
        where constraint_info.conname =
          'branch_meta_tracking_configs_page_load_meta_event_check'
      `);
      expect(rows[0]?.definition).toContain("'PageView'::text");
    } finally {
      await connection.close();
    }
  });
});
