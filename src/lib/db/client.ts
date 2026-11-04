import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { parseDatabaseUrl } from "@/lib/env/database-url";

export function createDatabaseClient(input: unknown, ssl = true) {
  const url = parseDatabaseUrl(input);
  const client = postgres(url, {
    max: 1,
    prepare: false,
    ssl: ssl ? "require" : false,
  });

  return {
    db: drizzle({ client }),
    close: () => client.end(),
  };
}

let connection: ReturnType<typeof createDatabaseClient> | undefined;

export function getDatabase() {
  connection ??= createDatabaseClient(
    process.env.DATABASE_URL,
    process.env.DATABASE_SSL !== "false",
  );
  return connection.db;
}
