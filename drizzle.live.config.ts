import { defineConfig } from "drizzle-kit";

import { parseLiveMigrationUrl } from "./src/lib/env/database-url";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: parseLiveMigrationUrl(process.env.DATABASE_LIVE_MIGRATION_URL),
  },
});
