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
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_local_test_key",
      DATABASE_URL:
        process.env.DATABASE_URL ??
        "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
      SUPABASE_SECRET_KEY: "sb_secret_local_test_key",
      SUPABASE_PUBLIC_ASSET_BUCKET: "public-assets",
      TRACKING_ENABLED: "false",
      CRON_SECRET: "test-cron-secret-123456",
    },
    reuseExistingServer: false,
    timeout: 120_000,
    url: baseURL,
  },
});
