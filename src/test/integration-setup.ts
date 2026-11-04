process.env.NEXT_PUBLIC_APP_ENV = "local";
process.env.NEXT_PUBLIC_SITE_URL = "http://127.0.0.1:3100";
process.env.DATABASE_URL =
  "postgresql://kgj_app:local-app-password@127.0.0.1:54329/kgj?sslmode=disable";
process.env.DATABASE_SSL = "false";
process.env.ADMIN_SESSION_SECRET =
  "test-admin-session-secret-at-least-32-characters";
process.env.TRACKING_HMAC_SECRET =
  "test-tracking-hmac-secret-at-least-32-characters";
process.env.MEDIA_STORAGE_ROOT = ".media-integration";
process.env.MEDIA_PUBLIC_BASE_URL = "http://127.0.0.1:3100/media";
process.env.CRON_SECRET = "test-cron-secret-123456";
