import { describe, expect, it } from "vitest";

import {
  parseDatabaseUrl,
  parseLiveMigrationUrl,
  parseLocalMigrationUrl,
} from "./database-url";
import { parseServerEnv } from "./server-schema";
import { EnvironmentValidationError, parseClientEnv } from "./schema";

const validServerEnvironment = {
  NEXT_PUBLIC_APP_ENV: "local",
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  DATABASE_URL:
    "postgresql://kgj_app:password@127.0.0.1:54329/kgj?sslmode=disable",
  DATABASE_SSL: "false",
  ADMIN_SESSION_SECRET: "test-admin-session-secret-at-least-32-characters",
  TRACKING_HMAC_SECRET: "test-tracking-hmac-secret-at-least-32-characters",
  MEDIA_STORAGE_ROOT: ".media-test",
  MEDIA_PUBLIC_BASE_URL: "http://localhost:3000/media",
  TRACKING_ENABLED: "false",
  CRON_SECRET: "test-cron-secret-123456",
};

describe("environment contract", () => {
  it("parses a minimal local server environment with tracking disabled", () => {
    const environment = parseServerEnv(validServerEnvironment);

    expect(environment.NEXT_PUBLIC_APP_ENV).toBe("local");
    expect(environment.TRACKING_ENABLED).toBe("false");
  });

  it("accepts the complete global Meta fallback when tracking is enabled", () => {
    const environment = parseServerEnv({
      ...validServerEnvironment,
      TRACKING_ENABLED: "true",
      NEXT_PUBLIC_META_PIXEL_ID: "1234567890",
      META_CAPI_ACCESS_TOKEN: "test-meta-access-token",
    });

    expect(environment.TRACKING_ENABLED).toBe("true");
  });

  it("rejects partial global Meta configuration", () => {
    expect(() =>
      parseServerEnv({
        ...validServerEnvironment,
        TRACKING_ENABLED: "true",
        NEXT_PUBLIC_META_PIXEL_ID: "1234567890",
      }),
    ).toThrow(/META_CAPI/);
  });

  it("does not expose server-only configuration to the client parser", () => {
    const environment = parseClientEnv({
      ...validServerEnvironment,
      ADMIN_SESSION_SECRET: "accidentally-public-secret",
    });

    expect(Object.keys(environment).sort()).toEqual([
      "NEXT_PUBLIC_APP_ENV",
      "NEXT_PUBLIC_SITE_URL",
    ]);
  });

  it("requires HTTPS public URLs outside local development", () => {
    expect(() =>
      parseServerEnv({
        ...validServerEnvironment,
        NEXT_PUBLIC_APP_ENV: "production",
        NEXT_PUBLIC_SITE_URL: "http://link.example.com",
        MEDIA_PUBLIC_BASE_URL: "https://link.example.com/media",
      }),
    ).toThrow(/NEXT_PUBLIC_SITE_URL/);
    expect(() =>
      parseServerEnv({
        ...validServerEnvironment,
        NEXT_PUBLIC_APP_ENV: "production",
        NEXT_PUBLIC_SITE_URL: "https://link.example.com",
        MEDIA_PUBLIC_BASE_URL: "http://link.example.com/media",
      }),
    ).toThrow(/MEDIA_PUBLIC_BASE_URL/);
  });

  it("reports invalid variable names without revealing supplied secrets", () => {
    const secret = "must-never-appear-in-an-error";

    try {
      parseServerEnv({
        ...validServerEnvironment,
        DATABASE_URL: undefined,
        ADMIN_SESSION_SECRET: secret,
        CRON_SECRET: "short",
      });
    } catch (error) {
      expect(error).toBeInstanceOf(EnvironmentValidationError);
      expect(String(error)).toContain("DATABASE_URL");
      expect(String(error)).toContain("CRON_SECRET");
      expect(String(error)).not.toContain(secret);
    }
  });

  it("accepts PostgreSQL URLs but rejects other protocols without echoing secrets", () => {
    expect(parseDatabaseUrl(validServerEnvironment.DATABASE_URL)).toBe(
      validServerEnvironment.DATABASE_URL,
    );
    const invalid = "https://user:do-not-log-this@example.com/database";
    expect(() => parseDatabaseUrl(invalid)).toThrow("DATABASE_URL");
    try {
      parseDatabaseUrl(invalid);
    } catch (error) {
      expect(String(error)).not.toContain("do-not-log-this");
    }
  });

  it("limits migrations to the known local or private production targets", () => {
    const local =
      "postgresql://postgres:password@127.0.0.1:54329/kgj?sslmode=disable";
    const live = "postgresql://postgres:password@db:5432/kgj?sslmode=disable";
    expect(parseLocalMigrationUrl(local)).toBe(local);
    expect(parseLiveMigrationUrl(live)).toBe(live);
    expect(() => parseLocalMigrationUrl(live)).toThrow(
      "DATABASE_MIGRATION_URL",
    );
    expect(() => parseLiveMigrationUrl(local)).toThrow(
      "DATABASE_LIVE_MIGRATION_URL",
    );
  });
});
