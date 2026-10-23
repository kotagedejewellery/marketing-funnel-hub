import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env/server", () => ({
  serverEnv: {
    NEXT_PUBLIC_APP_ENV: "production",
    SUPABASE_SECRET_KEY: "test-secret-not-for-production",
  },
}));

import { NextRequest } from "next/server";

import { externalIdCookieName, updatePublicJourney } from "./journey";

describe("public tracking journey", () => {
  it("creates a persistent pseudonymous ID and an fbc from a valid Meta click ID", () => {
    const response = updatePublicJourney(
      new NextRequest(
        "https://link.kotagedejewellery.com/yogyakarta?fbclid=IwAR0valid_click_id",
      ),
    );

    expect(response.cookies.get(externalIdCookieName)?.value).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(response.cookies.get("_fbc")?.value).toMatch(
      /^fb\.1\.\d+\.IwAR0valid_click_id$/,
    );
  });

  it("keeps the existing pseudonymous ID", () => {
    const externalId = "2ad5c767-2f2c-4d45-a790-b3ddc47e9d16";
    const response = updatePublicJourney(
      new NextRequest("https://link.kotagedejewellery.com/yogyakarta", {
        headers: { cookie: `${externalIdCookieName}=${externalId}` },
      }),
    );

    expect(response.cookies.get(externalIdCookieName)?.value).toBe(externalId);
  });

  it("does not create fbc from a malformed click ID", () => {
    const response = updatePublicJourney(
      new NextRequest(
        "https://link.kotagedejewellery.com/yogyakarta?fbclid=invalid%3Bvalue",
      ),
    );

    expect(response.cookies.get("_fbc")).toBeUndefined();
  });
});
