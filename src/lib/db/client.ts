import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { parseDatabaseUrl } from "@/lib/env/database-url";

const internalDatabaseHosts = new Set([
  "127.0.0.1",
  "localhost",
  "supabase-db",
]);

export function createDatabaseClient(input: unknown) {
  const url = parseDatabaseUrl(input);
  const isInternalDatabase = internalDatabaseHosts.has(new URL(url).hostname);
  const client = postgres(url, {
    max: 1,
    prepare: false,
    ssl: isInternalDatabase ? false : "require",
  });

  return {
    db: drizzle({ client }),
    close: () => client.end(),
  };
}

let connection: ReturnType<typeof createDatabaseClient> | undefined;

export function getDatabase() {
  connection ??= createDatabaseClient(process.env.DATABASE_URL);
  return connection.db;
}
