import { describe, expect, it } from "vitest";

import { canonicalEventSchema } from "./event";

const base = {
  eventId: "a7cb942c-0e0d-465e-8d6a-04569990228b",
  eventTime: "2026-09-18T04:30:00.000Z",
  anonymousSessionId: "bdbe6f79-7725-414d-a105-169c9bb5c2fa",
  pageUrl: "https://example.com/",
  attribution: {
    source: null,
    campaign: null,
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    utmContent: null,
    utmTerm: null,
  },
  metadata: {},
};

describe("canonical event contract", () => {
  it("keeps PageView free of product and branch context", () => {
    expect(
      canonicalEventSchema.safeParse({
        ...base,
        eventName: "PageView",
        product: null,
        branch: null,
        cta: null,
      }).success,
    ).toBe(true);
    expect(
      canonicalEventSchema.safeParse({
        ...base,
        eventName: "PageView",
        product: { id: base.eventId, category: "wedding-ring" },
        branch: null,
        cta: null,
      }).success,
    ).toBe(false);
  });

  it("requires product context for ViewContent and product plus branch for Contact", () => {
    const product = { id: base.eventId, category: "wedding-ring" };
    const branch = { id: base.anonymousSessionId, name: "Surabaya" };
    expect(
      canonicalEventSchema.safeParse({
        ...base,
        eventName: "ViewContent",
        product,
        branch: null,
        cta: null,
      }).success,
    ).toBe(true);
    expect(
      canonicalEventSchema.safeParse({
        ...base,
        eventName: "Contact",
        product,
        branch,
        cta: "whatsapp",
      }).success,
    ).toBe(true);
    expect(
      canonicalEventSchema.safeParse({
        ...base,
        eventName: "Contact",
        product,
        branch: null,
        cta: "whatsapp",
      }).success,
    ).toBe(false);
  });
});
