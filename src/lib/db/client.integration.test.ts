import { sql } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createDatabaseClient } from "./client";

describe("Drizzle database client", () => {
  it("rejects invalid configuration without revealing the supplied URL", () => {
    const invalid = "https://user:do-not-log-this@example.com/database";

    expect(() => createDatabaseClient(invalid)).toThrow("DATABASE_URL");
    try {
      createDatabaseClient(invalid);
    } catch (error) {
      expect(String(error)).not.toContain("do-not-log-this");
    }
  });

  it("connects to the local PostgreSQL database through Drizzle", async () => {
    const connection = createDatabaseClient(process.env.DATABASE_URL);

    try {
      const rows = await connection.db.execute(sql`select 1 as connected`);
      expect(rows[0]?.connected).toBe(1);
    } finally {
      await connection.close();
    }
  });
});
