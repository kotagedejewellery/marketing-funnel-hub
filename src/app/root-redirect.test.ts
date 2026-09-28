import { beforeEach, describe, expect, it, vi } from "vitest";

const { redirect } = vi.hoisted(() => ({ redirect: vi.fn() }));

vi.mock("next/navigation", () => ({ redirect }));

import HomePage from "./page";

describe("root route", () => {
  beforeEach(() => {
    redirect.mockReset();
  });

  it("redirects the deployment root to the existing CMS login", () => {
    HomePage();

    expect(redirect).toHaveBeenCalledWith("/admin/login");
  });
});
