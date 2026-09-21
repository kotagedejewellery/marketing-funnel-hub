import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env/server", () => ({
  serverEnv: {
    NEXT_PUBLIC_SITE_URL: "https://kgj.example",
    META_CAPI_DATASET_ID: "123456",
    META_CAPI_ACCESS_TOKEN: "test-token-not-for-network",
  },
}));

import { metaPayload, sendMetaCapi } from "./meta-capi";

const event = {
  eventId: "a7cb942c-0e0d-465e-8d6a-04569990228b",
  eventName: "Contact" as const,
  eventTime: "2026-09-20T04:30:00.000Z",
  anonymousSessionId: "bdbe6f79-7725-414d-a105-169c9bb5c2fa",
  pageUrl: "https://kgj.example/",
  product: {
    id: "64fc62e9-2aac-40df-bc1c-0ce7b97e94c5",
    category: "wedding-ring",
  },
  branch: { id: "7200491e-ac86-4696-9948-cced9702dbd5", name: "Surabaya" },
  cta: "whatsapp" as const,
  attribution: {
    source: "instagram",
    campaign: "wedding_september",
    utmSource: "instagram",
    utmMedium: "paid_social",
    utmCampaign: "wedding_september",
    utmContent: "video_a",
    utmTerm: null,
  },
  metadata: {},
};
const resolved = {
  product: { id: event.product.id, slug: "wedding-ring" },
  branch: { id: event.branch.id, name: "Surabaya" },
};
const request = new Request("https://kgj.example/api/events", {
  headers: { "user-agent": "Test Browser", "x-forwarded-for": "203.0.113.1" },
});

describe("Meta CAPI adapter", () => {
  it("reuses the canonical event ID and maps authoritative product and branch context", () => {
    const payload = metaPayload(event, resolved, request, { fbp: "fb.1.test" });
    expect(payload?.data[0]).toMatchObject({
      event_name: "Contact",
      event_id: event.eventId,
      action_source: "website",
      user_data: { fbp: "fb.1.test", client_user_agent: "Test Browser" },
      custom_data: {
        content_category: "wedding-ring",
        branch: "Surabaya",
        cta: "whatsapp",
      },
    });
    expect(JSON.stringify(payload)).not.toContain(event.anonymousSessionId);
  });

  it("does not send when there is no approved matching data", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));
    try {
      const emptyRequest = new Request("https://kgj.example/api/events");
      await sendMetaCapi(event, resolved, emptyRequest, {});
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      fetchMock.mockRestore();
    }
  });
});
