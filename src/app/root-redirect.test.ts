import { beforeEach, describe, expect, it, vi } from "vitest";

const { redirect, loadDefaultLinkBioSlug } = vi.hoisted(() => ({
  redirect: vi.fn(),
  loadDefaultLinkBioSlug: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/modules/public-content/data", () => ({ loadDefaultLinkBioSlug }));

import HomePage from "./page";

describe("root route", () => {
  beforeEach(() => {
    redirect.mockReset();
    loadDefaultLinkBioSlug.mockReset();
  });

  it("redirects the deployment root to the configured branch with its query", async () => {
    loadDefaultLinkBioSlug.mockResolvedValue("yogyakarta");

    await HomePage({
      searchParams: Promise.resolve({
        utm_source: "instagram",
        utm_campaign: "cincin september",
        utm_content: ["reel", "variant-a"],
      }),
    });

    expect(redirect).toHaveBeenCalledWith(
      "/yogyakarta?utm_source=instagram&utm_campaign=cincin+september&utm_content=reel&utm_content=variant-a",
    );
  });

  it("keeps the CMS login as a safe fallback when no main branch is configured", async () => {
    loadDefaultLinkBioSlug.mockResolvedValue(null);

    await HomePage({ searchParams: Promise.resolve({}) });

    expect(redirect).toHaveBeenCalledWith("/admin/login");
  });
});
