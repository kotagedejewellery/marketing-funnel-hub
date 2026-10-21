import { fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env/client", () => ({
  clientEnv: { NEXT_PUBLIC_APP_ENV: "production" },
}));

import { TrackingBehavior } from "./tracking-behavior";

const eventId = "7d82e63e-16dd-4f36-8eb4-ea9f008f3f01";
const pixel = vi.fn();

beforeEach(() => {
  vi.stubGlobal("crypto", { randomUUID: () => eventId });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response()));
  Object.assign(window, { fbq: pixel, _fbq: pixel });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete (window as Window & { fbq?: unknown; _fbq?: unknown }).fbq;
  delete (window as Window & { fbq?: unknown; _fbq?: unknown })._fbq;
  delete (window as Window & { __kgjMetaPixelIds?: unknown }).__kgjMetaPixelIds;
});

describe("TrackingBehavior", () => {
  it("always sends PageView when a Link Bio opens", () => {
    render(
      <main id="main-content">
        <TrackingBehavior
          context={{
            anonymousSessionId: "3e29fb31-6d56-44b5-ad41-a8e97ac7281a",
            attribution: {
              source: null,
              campaign: null,
              utmSource: null,
              utmMedium: null,
              utmCampaign: null,
              utmContent: null,
              utmTerm: null,
            },
          }}
          products={[]}
          links={[]}
          branch={{ id: "f323c0b8-69eb-49fd-9048-fefea8e7c4d0", name: "Pusat" }}
          metaTracking={{ pixelId: "123456", whatsappCtaMetaEvent: "Lead" }}
        />
      </main>,
    );

    expect(pixel).toHaveBeenLastCalledWith(
      "trackSingle",
      "123456",
      "PageView",
      expect.objectContaining({ cta: null }),
      { eventID: eventId },
    );
  });

  it("sends the selected Meta event for a WhatsApp CTA while storing Contact", () => {
    const { getByRole } = render(
      <main id="main-content">
        <article data-track-product-id="product-1">
          <a
            href="https://wa.me/628123456789"
            data-track="whatsapp"
            data-track-branch-id="branch-1"
            onClick={(event) => event.preventDefault()}
          >
            WhatsApp
          </a>
        </article>
        <TrackingBehavior
          context={{
            anonymousSessionId: "3e29fb31-6d56-44b5-ad41-a8e97ac7281a",
            attribution: {
              source: null,
              campaign: null,
              utmSource: null,
              utmMedium: null,
              utmCampaign: null,
              utmContent: null,
              utmTerm: null,
            },
          }}
          products={[
            {
              id: "product-1",
              slug: "wedding-ring",
              branches: [{ id: "branch-1", name: "Pusat" }],
            },
          ]}
          links={[]}
          branch={{ id: "branch-1", name: "Pusat" }}
          metaTracking={{
            pixelId: "123456",
            whatsappCtaMetaEvent: "AddPaymentInfo",
          }}
        />
      </main>,
    );

    fireEvent.click(getByRole("link", { name: "WhatsApp" }));

    expect(pixel).toHaveBeenLastCalledWith(
      "trackSingle",
      "123456",
      "AddPaymentInfo",
      expect.objectContaining({ cta: "whatsapp" }),
      { eventID: eventId },
    );
    expect(fetch).toHaveBeenLastCalledWith(
      "/api/events",
      expect.objectContaining({
        body: expect.stringContaining('"eventName":"Contact"'),
      }),
    );
  });
});
