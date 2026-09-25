import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { trackingRequestContext } from "./request-context";

describe("tracking request context", () => {
  it("stores only coarse device, browser, country, and city values", () => {
    const context = trackingRequestContext(
      new Request("https://example.com/api/events", {
        headers: {
          "user-agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",
          "x-vercel-ip-country": "id",
          "x-vercel-ip-city": "Yogyakarta",
        },
      }),
    );
    expect(context).toEqual({
      deviceType: "mobile",
      browserFamily: "Safari",
      countryCode: "ID",
      city: "Yogyakarta",
    });
    expect(context).not.toHaveProperty("userAgent");
  });

  it("drops malformed Vercel location headers", () => {
    const context = trackingRequestContext(
      new Request("https://example.com/api/events", {
        headers: {
          "x-vercel-ip-country": "Indonesia",
          "x-vercel-ip-city": "%",
        },
      }),
    );
    expect(context.countryCode).toBeNull();
    expect(context.city).toBeNull();
  });
});
