import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env/server", () => ({
  serverEnv: { MEDIA_STORAGE_ROOT: "media-root" },
}));

import { resolveMediaPath } from "./server";

describe("media storage path", () => {
  it("keeps public assets below the configured media root", () => {
    expect(resolveMediaPath("gallery/branch/image.webp")).toContain("gallery");
    expect(() => resolveMediaPath("gallery/../secret.webp")).toThrow(
      "Invalid media path.",
    );
  });
});
