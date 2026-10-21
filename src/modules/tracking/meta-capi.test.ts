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
  link: null,
};
const request = new Request("https://kgj.example/api/events", {
  headers: { "user-agent": "Test Browser", "x-forwarded-for": "203.0.113.1" },
});

describe("Meta CAPI adapter", () => {
  it("reuses the canonical event ID and maps authoritative product and branch context", () => {
    const payload = metaPayload(
      event,
      resolved,
      request,
      { fbp: "fb.1.test" },
      "Contact",
    );
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

  it("does not fall back to global CAPI after a branch disables Meta", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));
    try {
      await sendMetaCapi(
        event,
        resolved,
        request,
        { fbp: "fb.1.test" },
        {
          pixelId: null,
          pageLoadMetaEvent: null,
          datasetId: null,
          capiAccessToken: null,
        },
      );
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      fetchMock.mockRestore();
    }
  });

  it("does not send a page load when its Meta event is disabled", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));
    try {
      await sendMetaCapi(
        {
          ...event,
          eventName: "PageView",
          product: null,
          branch: null,
          cta: null,
        },
        { product: null, branch: null, link: null },
        request,
        { fbp: "fb.1.test" },
        {
          pixelId: "123456",
          pageLoadMetaEvent: null,
          datasetId: "123456",
          capiAccessToken: "test-token-not-for-network",
        },
      );
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      fetchMock.mockRestore();
    }
  });

  it("maps a page load to the configured standard Meta event", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));
    const pageView = {
      ...event,
      eventName: "PageView" as const,
      product: null,
      branch: null,
      cta: null,
    };
    try {
      await sendMetaCapi(
        pageView,
        { product: null, branch: null, link: null },
        request,
        { fbp: "fb.1.test" },
        {
          pixelId: "123456",
          pageLoadMetaEvent: "ViewContent",
          datasetId: "123456",
          capiAccessToken: "test-token-not-for-network",
        },
      );

      const requestBody = JSON.parse(
        String(fetchMock.mock.calls[0]?.[1]?.body),
      ) as { data: Array<{ event_id: string; event_name: string }> };
      expect(requestBody.data[0]).toMatchObject({
        event_id: pageView.eventId,
        event_name: "ViewContent",
      });
    } finally {
      fetchMock.mockRestore();
    }
  });

  it("adds an optional branch test code only to the CAPI payload", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));
    try {
      await sendMetaCapi(
        event,
        resolved,
        request,
        { fbp: "fb.1.test" },
        {
          pixelId: "123456",
          pageLoadMetaEvent: "PageView",
          datasetId: "123456",
          capiAccessToken: "test-token-not-for-network",
          capiTestEventCode: "TEST123",
        },
      );

      const requestBody = JSON.parse(
        String(fetchMock.mock.calls[0]?.[1]?.body),
      ) as { test_event_code?: string };
      expect(requestBody.test_event_code).toBe("TEST123");
    } finally {
      fetchMock.mockRestore();
    }
  });
});
