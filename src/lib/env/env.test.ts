import { describe, expect, it } from "vitest";

import { EnvironmentValidationError, parseClientEnv } from "./schema";
import { parseDatabaseUrl, parseLocalMigrationUrl } from "./database-url";
import { parseServerEnv } from "./server-schema";

const validServerEnvironment = {
  NEXT_PUBLIC_APP_ENV: "local",
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_local_test_key",
  DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  SUPABASE_SECRET_KEY: "sb_secret_local_test_key",
  SUPABASE_PUBLIC_ASSET_BUCKET: "public-assets",
  TRACKING_ENABLED: "false",
  CRON_SECRET: "test-cron-secret-123456",
};

describe("environment contract", () => {
  it("parses a minimal local server environment with tracking disabled", () => {
    const environment = parseServerEnv(validServerEnvironment);

    expect(environment.NEXT_PUBLIC_APP_ENV).toBe("local");
    expect(environment.TRACKING_ENABLED).toBe("false");
  });

  it("reports only invalid variable names without exposing supplied secrets", () => {
    const secret = "must-never-appear-in-an-error";

    expect(() =>
      parseServerEnv({
        ...validServerEnvironment,
        DATABASE_URL: undefined,
        SUPABASE_SECRET_KEY: secret,
        CRON_SECRET: "short",
      }),
    ).toThrow(EnvironmentValidationError);

    try {
      parseServerEnv({
        ...validServerEnvironment,
        DATABASE_URL: undefined,
        SUPABASE_SECRET_KEY: secret,
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

  it("reports malformed public URLs by variable name without leaking their values", () => {
    const invalidUrl = "https://[not-an-ipv6-address]";

    for (const variable of [
      "NEXT_PUBLIC_SITE_URL",
      "NEXT_PUBLIC_SUPABASE_URL",
    ] as const) {
      try {
        parseServerEnv({
          ...validServerEnvironment,
          NEXT_PUBLIC_APP_ENV: "production",
          NEXT_PUBLIC_SITE_URL: "https://marketing.example.com",
          NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
          [variable]: invalidUrl,
        });
        throw new Error("Expected invalid environment configuration");
      } catch (error) {
        expect(error).toBeInstanceOf(EnvironmentValidationError);
        expect(String(error)).toContain(variable);
        expect(String(error)).not.toContain(invalidUrl);
      }
    }
  });

  it("rejects staging because only local and live environments are supported", () => {
    expect(() =>
      parseClientEnv({
        ...validServerEnvironment,
        NEXT_PUBLIC_APP_ENV: "staging",
        NEXT_PUBLIC_SITE_URL: "https://preview.example.com",
        NEXT_PUBLIC_SUPABASE_URL: "https://staging.supabase.co",
      }),
    ).toThrow(/NEXT_PUBLIC_APP_ENV/);
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
