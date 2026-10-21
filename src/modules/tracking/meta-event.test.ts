import { describe, expect, it } from "vitest";

import {
  metaCtaEventNames,
  metaStandardEventNames,
  resolveMetaProviderEvent,
} from "./meta-event";

describe("Meta provider event mapping", () => {
  it("allows only approved standard CTA event names", () => {
    expect(metaStandardEventNames).toEqual([
      "PageView",
      "ViewContent",
      "AddToCart",
      "AddToWishlist",
      "InitiateCheckout",
      "AddPaymentInfo",
      "Purchase",
      "Lead",
      "CompleteRegistration",
      "Contact",
    ]);
    expect(metaCtaEventNames).not.toContain("PageView");
  });

  it("always maps an internal page view to Meta PageView", () => {
    expect(
      resolveMetaProviderEvent({ eventName: "PageView", cta: null }, "Lead"),
    ).toEqual({
      name: "PageView",
      type: "standard",
    });
  });

  it("maps a WhatsApp CTA to its selected standard Meta event", () => {
    expect(
      resolveMetaProviderEvent(
        { eventName: "Contact", cta: "whatsapp" },
        "AddPaymentInfo",
      ),
    ).toEqual({
      name: "AddPaymentInfo",
      type: "standard",
    });
  });

  it("keeps non-WhatsApp provider events canonical", () => {
    expect(
      resolveMetaProviderEvent({ eventName: "LinkClick", cta: "link" }, "Lead"),
    ).toEqual({ name: "LinkClick", type: "custom" });
  });
});
