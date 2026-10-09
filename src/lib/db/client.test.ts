import { beforeEach, describe, expect, it, vi } from "vitest";

const { drizzleMock, postgresMock } = vi.hoisted(() => ({
  drizzleMock: vi.fn(),
  postgresMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("drizzle-orm/postgres-js", () => ({ drizzle: drizzleMock }));
vi.mock("postgres", () => ({ default: postgresMock }));

import { createDatabaseClient } from "./client";

describe("createDatabaseClient", () => {
  beforeEach(() => {
    drizzleMock.mockReturnValue({});
    postgresMock.mockReturnValue({ end: vi.fn() });
    drizzleMock.mockClear();
    postgresMock.mockClear();
  });

  it("does not use TLS for the self-hosted Supabase Docker database", () => {
    const url =
      "postgresql://postgres:password@supabase-db:5432/postgres?sslmode=disable";

    createDatabaseClient(url);

    expect(postgresMock).toHaveBeenCalledWith(url, {
      max: 1,
      prepare: false,
      ssl: false,
    });
  });

  it("requires TLS for databases outside the internal Docker network", () => {
    const url =
      "postgresql://postgres:password@db.example.com:5432/postgres?sslmode=require";

    createDatabaseClient(url);

    expect(postgresMock).toHaveBeenCalledWith(url, {
      max: 1,
      prepare: false,
      ssl: "require",
    });
  });
});
