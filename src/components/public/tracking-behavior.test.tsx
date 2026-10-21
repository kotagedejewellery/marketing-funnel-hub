import { render } from "@testing-library/react";
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
  it("sends the selected standard Meta event for a page load", () => {
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
          metaTracking={{ pixelId: "123456", pageLoadMetaEvent: "ViewContent" }}
        />
      </main>,
    );

    expect(pixel).toHaveBeenLastCalledWith(
      "trackSingle",
      "123456",
      "ViewContent",
      expect.objectContaining({ cta: null }),
      { eventID: eventId },
    );
  });
});
