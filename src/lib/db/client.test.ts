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

  it("can disable TLS for an internal PostgreSQL network", () => {
    const url = "postgresql://kgj_app:password@db:5432/kgj?sslmode=disable";

    createDatabaseClient(url, false);

    expect(postgresMock).toHaveBeenCalledWith(url, {
      max: 1,
      prepare: false,
      ssl: false,
    });
  });

  it("requires TLS by default", () => {
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
