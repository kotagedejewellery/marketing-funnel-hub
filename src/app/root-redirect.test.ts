import { beforeEach, describe, expect, it, vi } from "vitest";

const { redirect, connection, loadDefaultLinkBioSlug, renderBranchLinkBio } =
  vi.hoisted(() => ({
    redirect: vi.fn(),
    connection: vi.fn(),
    loadDefaultLinkBioSlug: vi.fn(),
    renderBranchLinkBio: vi.fn(),
  }));

vi.mock("next/navigation", () => ({ redirect }));
vi.mock("next/server", () => ({ connection }));
vi.mock("@/modules/public-content/data", () => ({ loadDefaultLinkBioSlug }));
vi.mock("@/modules/public-content/render", () => ({ renderBranchLinkBio }));

import HomePage from "./page";

describe("root route", () => {
  beforeEach(() => {
    redirect.mockReset();
    connection.mockResolvedValue(undefined);
    loadDefaultLinkBioSlug.mockReset();
    renderBranchLinkBio.mockReset();
  });

  it("renders the configured main branch at the deployment root", async () => {
    loadDefaultLinkBioSlug.mockResolvedValue("yogyakarta");
    renderBranchLinkBio.mockResolvedValue("Yogyakarta");

    await HomePage();

    expect(renderBranchLinkBio).toHaveBeenCalledWith("yogyakarta");
    expect(redirect).not.toHaveBeenCalled();
  });

  it("keeps the CMS login as a safe fallback when no main branch is configured", async () => {
    loadDefaultLinkBioSlug.mockResolvedValue(null);

    await HomePage();

    expect(redirect).toHaveBeenCalledWith("/admin/login");
  });
});
