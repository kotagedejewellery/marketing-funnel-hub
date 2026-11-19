import { describe, expect, it } from "vitest";

import { branchDeletionBlockReason } from "./deletion";

describe("branch deletion eligibility", () => {
  it("only permits deletion for a non-default page without retained history", () => {
    expect(
      branchDeletionBlockReason({
        isDefault: false,
        hasEvents: false,
        hasFormSubmissions: false,
      }),
    ).toBeNull();
  });

  it("protects the default page and tracking or form history", () => {
    expect(
      branchDeletionBlockReason({
        isDefault: true,
        hasEvents: false,
        hasFormSubmissions: false,
      }),
    ).toMatch(/halaman utama/i);
    expect(
      branchDeletionBlockReason({
        isDefault: false,
        hasEvents: true,
        hasFormSubmissions: false,
      }),
    ).toMatch(/tracking/i);
    expect(
      branchDeletionBlockReason({
        isDefault: false,
        hasEvents: false,
        hasFormSubmissions: true,
      }),
    ).toMatch(/respons form/i);
  });
});
