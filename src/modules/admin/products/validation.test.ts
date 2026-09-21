import { describe, expect, it } from "vitest";

import { productSchema } from "./validation";

describe("product input", () => {
  it("accepts a canonical slug and rejects spaces or uppercase", () => {
    const input = {
      id: "",
      name: "Wedding Ring",
      slug: "wedding-ring",
      description: "",
      isActive: true,
      sortOrder: "0",
    };
    expect(productSchema.safeParse(input).success).toBe(true);
    expect(
      productSchema.safeParse({ ...input, slug: "Wedding Ring" }).success,
    ).toBe(false);
  });
});
