import { describe, expect, it } from "vitest";

import { branchSchema } from "./validation";

describe("branch input", () => {
  it("requires country-code digits for WhatsApp", () => {
    const input = {
      id: "",
      name: "Surabaya",
      slug: "surabaya",
      whatsappNumber: "628123456789",
      ctaLabel: "",
      isActive: true,
      sortOrder: "0",
    };
    expect(branchSchema.safeParse(input).success).toBe(true);
    expect(
      branchSchema.safeParse({ ...input, whatsappNumber: "+62 8123456789" })
        .success,
    ).toBe(false);
  });
});
