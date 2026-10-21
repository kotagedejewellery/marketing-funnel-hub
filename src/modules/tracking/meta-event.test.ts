import { describe, expect, it } from "vitest";

import { metaStandardEventNames, resolveMetaProviderEvent } from "./meta-event";

describe("Meta provider event mapping", () => {
  it("allows only the approved standard page-load event names", () => {
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
  });

  it("maps an internal page view to the selected standard Meta event", () => {
    expect(resolveMetaProviderEvent("PageView", "ViewContent")).toEqual({
      name: "ViewContent",
      type: "standard",
    });
  });

  it("can suppress only the provider page-load event", () => {
    expect(resolveMetaProviderEvent("PageView", null)).toBeNull();
    expect(resolveMetaProviderEvent("Contact", null)).toEqual({
      name: "Contact",
      type: "standard",
    });
  });
});
