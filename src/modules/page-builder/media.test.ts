import { describe, expect, it } from "vitest";

import { releasedBuilderImagePaths } from "./media";

const branchId = "3f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4";
const image = (id: string) => ({
  id,
  type: "image" as const,
  path: `builder/${branchId}/${id}.webp`,
  alt: "Cincin emas",
  width: "full" as const,
  isVisible: true,
});

describe("releasedBuilderImagePaths", () => {
  it("keeps an image while either the draft or public layout still uses it", () => {
    const publishedImage = image("4f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4");
    const removedDraftImage = image("5f16a3d0-89d1-4f91-b982-b0a1dcf6a4d4");

    expect(
      releasedBuilderImagePaths({
        branchId,
        previousDraft: [publishedImage, removedDraftImage],
        previousPublished: [publishedImage],
        nextDraft: [],
        nextPublished: [publishedImage],
      }),
    ).toEqual([removedDraftImage.path]);
  });
});
