import { defineConfig, devices } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const baseURL = "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 120_000,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command:
      "node ./node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3100",
    env: {
      NEXT_PUBLIC_APP_ENV: "local",
      NEXT_PUBLIC_SITE_URL: baseURL,
      DATABASE_URL:
        process.env.DATABASE_URL ??
        "postgresql://kgj_app:local-app-password@127.0.0.1:54329/kgj?sslmode=disable",
      DATABASE_SSL: "false",
      ADMIN_SESSION_SECRET: "test-admin-session-secret-at-least-32-characters",
      TRACKING_HMAC_SECRET: "test-tracking-hmac-secret-at-least-32-characters",
      MEDIA_STORAGE_ROOT: ".media-e2e",
      MEDIA_PUBLIC_BASE_URL: `${baseURL}/media`,
      TRACKING_ENABLED: "false",
      CRON_SECRET: "test-cron-secret-123456",
    },
    reuseExistingServer: false,
    timeout: 120_000,
    url: baseURL,
  },
});
