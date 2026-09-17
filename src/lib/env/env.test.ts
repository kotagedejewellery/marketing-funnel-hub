import { describe, expect, it } from "vitest";

import { EnvironmentValidationError, parseClientEnv } from "./schema";
import { parseDatabaseUrl, parseLocalMigrationUrl } from "./database-url";
import { parseServerEnv } from "./server-schema";

const validServerEnvironment = {
  NEXT_PUBLIC_APP_ENV: "local",
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_local_test_key",
  NEXT_PUBLIC_META_PIXEL_ID: "1234567890",
  NEXT_PUBLIC_GTM_CONTAINER_ID: "GTM-ABC123",
  DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  SUPABASE_SECRET_KEY: "sb_secret_local_test_key",
  SUPABASE_PUBLIC_ASSET_BUCKET: "public-assets",
  SUPABASE_PRIVATE_MEDIA_BUCKET: "admin-media",
  META_CAPI_DATASET_ID: "1234567890",
  META_CAPI_ACCESS_TOKEN: "test_meta_access_token",
  EVENT_RATE_LIMIT_WINDOW_SECONDS: "60",
  EVENT_RATE_LIMIT_PER_IP: "30",
  EVENT_RATE_LIMIT_GLOBAL: "300",
  CRON_SECRET: "test-cron-secret-123456",
};

describe("environment contract", () => {
  it("parses a valid local server environment and coerces numeric limits", () => {
    const environment = parseServerEnv(validServerEnvironment);

    expect(environment.NEXT_PUBLIC_APP_ENV).toBe("local");
    expect(environment.EVENT_RATE_LIMIT_PER_IP).toBe(30);
    expect(environment.EVENT_RATE_LIMIT_GLOBAL).toBe(300);
  });

  it("reports only invalid variable names without exposing supplied secrets", () => {
    const secret = "must-never-appear-in-an-error";

    expect(() =>
      parseServerEnv({
        ...validServerEnvironment,
        DATABASE_URL: undefined,
        META_CAPI_ACCESS_TOKEN: secret,
        CRON_SECRET: "short",
      }),
    ).toThrow(EnvironmentValidationError);

    try {
      parseServerEnv({
        ...validServerEnvironment,
        DATABASE_URL: undefined,
        META_CAPI_ACCESS_TOKEN: secret,
        CRON_SECRET: "short",
      });
    } catch (error) {
      expect(String(error)).toContain("DATABASE_URL");
      expect(String(error)).toContain("CRON_SECRET");
      expect(String(error)).not.toContain(secret);
    }
  });

  it("returns only explicitly public variables from the client parser", () => {
    const environment = parseClientEnv({
      ...validServerEnvironment,
      NEXT_PUBLIC_SUPABASE_SECRET_KEY: "accidentally-public-secret",
    });

    expect(Object.keys(environment).sort()).toEqual([
      "NEXT_PUBLIC_APP_ENV",
      "NEXT_PUBLIC_GTM_CONTAINER_ID",
      "NEXT_PUBLIC_META_PIXEL_ID",
      "NEXT_PUBLIC_SITE_URL",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "NEXT_PUBLIC_SUPABASE_URL",
    ]);
  });

  it("requires HTTPS URLs outside the local environment", () => {
    expect(() =>
      parseServerEnv({
        ...validServerEnvironment,
        NEXT_PUBLIC_APP_ENV: "production",
        NEXT_PUBLIC_SITE_URL: "http://marketing.example.com",
        NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
      }),
    ).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });

  it("accepts PostgreSQL URLs but rejects other protocols without echoing secrets", () => {
    expect(parseDatabaseUrl(validServerEnvironment.DATABASE_URL)).toBe(
      validServerEnvironment.DATABASE_URL,
    );

    const invalid = "https://user:do-not-log-this@example.com/database";
    expect(() => parseDatabaseUrl(invalid)).toThrow(EnvironmentValidationError);
    expect(() => parseDatabaseUrl(invalid)).toThrow("DATABASE_URL");
    expect(() =>
      parseDatabaseUrl("postgresql://postgres@127.0.0.1:54322/postgres"),
    ).toThrow("DATABASE_URL");

    try {
      parseDatabaseUrl(invalid);
    } catch (error) {
      expect(String(error)).not.toContain("do-not-log-this");
    }
  });

  it("allows the migration command to target only the local Supabase database", () => {
    expect(parseLocalMigrationUrl(validServerEnvironment.DATABASE_URL)).toBe(
      validServerEnvironment.DATABASE_URL,
    );

    expect(() =>
      parseLocalMigrationUrl(
        "postgresql://migrator:secret@production.example.com:5432/postgres",
      ),
    ).toThrow("DATABASE_MIGRATION_URL");
    expect(() =>
      parseLocalMigrationUrl(
        "postgresql://migrator:secret@127.0.0.1:5432/postgres",
      ),
    ).toThrow("DATABASE_MIGRATION_URL");
  });
});
