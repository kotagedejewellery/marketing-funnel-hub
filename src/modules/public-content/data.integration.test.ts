import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { loadBranchDirectory } from "./data";

describe("public branch directory loader", () => {
  it("reads shared identity and active branch destinations", async () => {
    const directory = await loadBranchDirectory();

    expect(directory.siteName.trim().length).toBeGreaterThan(0);
    expect(Array.isArray(directory.branches)).toBe(true);
    expect(directory.branches.every((branch) => branch.slug.length > 0)).toBe(
      true,
    );
  });
});
