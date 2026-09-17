import * as z from "zod";

import { EnvironmentValidationError } from "./schema";

export const databaseUrlSchema = z.url().refine((value) => {
  const url = new URL(value);
  return (
    (url.protocol === "postgres:" || url.protocol === "postgresql:") &&
    url.username.length > 0 &&
    url.password.length > 0 &&
    url.hostname.length > 0 &&
    url.pathname.length > 1
  );
});

export function parseDatabaseUrl(
  input: unknown,
  variable = "DATABASE_URL",
): string {
  const result = databaseUrlSchema.safeParse(input);
  if (!result.success) throw new EnvironmentValidationError([variable]);
  return result.data;
}

export function parseLocalMigrationUrl(input: unknown): string {
  const variable = "DATABASE_MIGRATION_URL";
  const value = parseDatabaseUrl(input, variable);
  const url = new URL(value);

  if (
    url.hostname !== "127.0.0.1" ||
    url.port !== "54322" ||
    url.pathname !== "/postgres"
  ) {
    throw new EnvironmentValidationError([variable]);
  }

  return value;
}
