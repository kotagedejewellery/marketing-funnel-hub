import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "./tests/e2e",
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
      NEXT_PUBLIC_META_PIXEL_ID: "1234567890",
      NEXT_PUBLIC_GTM_CONTAINER_ID: "GTM-TEST123",
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
    },
    reuseExistingServer: false,
    timeout: 120_000,
    url: baseURL,
  },
});
