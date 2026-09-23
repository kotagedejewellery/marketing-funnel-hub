import { describe, expect, it } from "vitest";

import { branchPageTitle } from "./branch-title";

describe("branchPageTitle", () => {
  it("adds the site name when the branch name is only a location", () => {
    expect(branchPageTitle("Kotagede Jewellery", "Surabaya")).toBe(
      "Kotagede Jewellery Surabaya",
    );
  });

  it("does not repeat the site name when the branch name already includes it", () => {
    expect(
      branchPageTitle("Kotagede Jewellery", "Kotagede Jewellery Surabaya"),
    ).toBe("Kotagede Jewellery Surabaya");
  });
});
