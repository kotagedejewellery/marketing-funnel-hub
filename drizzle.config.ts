import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

import { parseLocalMigrationUrl } from "./src/lib/env/database-url";

loadEnvConfig(process.cwd());

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: parseLocalMigrationUrl(process.env.DATABASE_MIGRATION_URL),
  },
});
