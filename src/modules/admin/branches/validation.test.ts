import { describe, expect, it } from "vitest";

import { branchPageSchema, branchSectionKeys } from "./page-validation";
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
    expect(branchSchema.safeParse({ ...input, slug: "admin" }).success).toBe(
      false,
    );
    expect(branchSchema.safeParse({ ...input, slug: "api" }).success).toBe(
      false,
    );
  });

  it("allows an empty public title and includes the pinned profile logo section", () => {
    const result = branchPageSchema.safeParse({
      branchId: "00000000-0000-4000-8000-000000000001",
      headline: "",
      introduction: "",
      sections: branchSectionKeys.map((sectionKey, index) => ({
        sectionKey,
        publicTitle: "",
        sortOrder: String(index * 10),
        isActive: true,
      })),
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sections[0]).toMatchObject({
        sectionKey: "profile_logo",
        publicTitle: null,
      });
    }
  });
});
