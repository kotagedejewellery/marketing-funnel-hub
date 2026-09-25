"use client";

import { useEffect, useRef } from "react";

import { clientEnv } from "@/lib/env/client";
import type { CanonicalEvent } from "@/modules/tracking/event";

export type TrackingContext = Pick<
  CanonicalEvent,
  "anonymousSessionId" | "attribution"
>;

type TrackingProduct = {
  id: string;
  slug: string;
  branches: { id: string; name: string }[];
};

type TrackingLink = {
  id: string;
  label: string;
  type: "secondary" | "social";
};

type Pixel = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  loaded: boolean;
  version: string;
};

type ProviderWindow = Window & {
  fbq?: Pixel;
  _fbq?: Pixel;
  dataLayer?: Record<string, unknown>[];
};

function loadProviderScript(id: string, src: string) {
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.async = true;
  script.src = src;
  document.head.append(script);
}

function activateProviders() {
  if (clientEnv.NEXT_PUBLIC_APP_ENV !== "production") return;
  const browser = window as ProviderWindow;
  const metaPixelId = clientEnv.NEXT_PUBLIC_META_PIXEL_ID;
  const gtmContainerId = clientEnv.NEXT_PUBLIC_GTM_CONTAINER_ID;

  if (metaPixelId) {
    if (!browser.fbq) {
      const pixel = ((...args: unknown[]) => {
        if (pixel.callMethod) pixel.callMethod(...args);
        else pixel.queue.push(args);
      }) as Pixel;
      pixel.queue = [];
      pixel.loaded = true;
      pixel.version = "2.0";
      browser.fbq = pixel;
      browser._fbq = pixel;
      pixel("init", metaPixelId);
      loadProviderScript(
        "kgj-meta-pixel",
        "https://connect.facebook.net/en_US/fbevents.js",
      );
    }
    browser.fbq("consent", "grant");
  }

  if (gtmContainerId) {
    browser.dataLayer ??= [];
    if (!document.getElementById("kgj-gtm")) {
      browser.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    }
    loadProviderScript(
      "kgj-gtm",
      `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmContainerId)}`,
    );
  }
}

function sendEvent(event: CanonicalEvent) {
  const browser = window as ProviderWindow;

  if (typeof browser.fbq === "function") {
    try {
      browser.fbq(
        event.eventName === "LinkClick" ? "trackCustom" : "track",
        event.eventName,
        {
          product_category: event.product?.category ?? null,
          branch: event.branch?.name ?? null,
          cta: event.cta,
          source: event.attribution.source,
          campaign: event.attribution.campaign,
          ...(event.eventName === "LinkClick" && {
            link_label: event.link.label,
            link_type: event.link.type,
          }),
        },
        { eventID: event.eventId },
      );
    } catch {
      // Provider failure must not change a WhatsApp click.
    }
  }

  if (Array.isArray(browser.dataLayer)) {
    try {
      browser.dataLayer.push({
        event: {
          PageView: "kgj_page_view",
          ViewContent: "kgj_view_content",
          Contact: "kgj_contact",
          LinkClick: "kgj_link_click",
        }[event.eventName],
        event_id: event.eventId,
        anonymous_session_id: event.anonymousSessionId,
        product_category: event.product?.category ?? null,
        branch: event.branch?.name ?? null,
        cta: event.cta,
        link_label: event.eventName === "LinkClick" ? event.link.label : null,
        link_type: event.eventName === "LinkClick" ? event.link.type : null,
        utm_source: event.attribution.utmSource,
        utm_medium: event.attribution.utmMedium,
        utm_campaign: event.attribution.utmCampaign,
        utm_content: event.attribution.utmContent,
        utm_term: event.attribution.utmTerm,
      });
    } catch {
      // Provider failure must not change a WhatsApp click.
    }
  }

  try {
    void fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(event),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Internal event failure must not change a WhatsApp click.
  }
}

export function TrackingBehavior({
  context,
  products,
  links,
  branch,
}: {
  context: TrackingContext;
  products: TrackingProduct[];
  links: TrackingLink[];
  branch: { id: string; name: string };
}) {
  const pageViewSent = useRef(false);
  const viewedProductIds = useRef(new Set<string>());

  useEffect(() => {
    const root = document.getElementById("main-content");
    if (!root) return;

    const byId = new Map(products.map((product) => [product.id, product]));
    const linksById = new Map(links.map((link) => [link.id, link]));

    function baseEvent() {
      return {
        eventId: crypto.randomUUID(),
        eventTime: new Date().toISOString(),
        anonymousSessionId: context.anonymousSessionId,
        pageUrl: `${window.location.origin}${window.location.pathname}`,
        attribution: context.attribution,
        metadata: {},
      };
    }

    function pageView() {
      activateProviders();
      if (pageViewSent.current) return;
      pageViewSent.current = true;
      sendEvent({
        ...baseEvent(),
        eventName: "PageView",
        product: null,
        branch: null,
        cta: null,
      });
    }

    function onClick(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;
      const anchor = event.target.closest<HTMLAnchorElement>("a[data-track]");
      if (!anchor || !root?.contains(anchor)) return;
      const link = linksById.get(anchor.dataset.trackLinkId ?? "");
      if (link) {
        sendEvent({
          ...baseEvent(),
          eventName: "LinkClick",
          product: null,
          branch,
          cta: "link",
          link,
        });
        return;
      }
      const productCard = anchor.closest<HTMLElement>(
        "article[data-track-product-id]",
      );
      const product = byId.get(productCard?.dataset.trackProductId ?? "");
      const branch = product?.branches.find(
        (item) => item.id === anchor.dataset.trackBranchId,
      );
      if (!product || !branch) return;
      if (!viewedProductIds.current.has(product.id)) {
        sendEvent({
          ...baseEvent(),
          eventName: "ViewContent",
          product: { id: product.id, category: product.slug },
          branch: null,
          cta: null,
        });
        viewedProductIds.current.add(product.id);
      }
      sendEvent({
        ...baseEvent(),
        eventName: "Contact",
        product: { id: product.id, category: product.slug },
        branch: { id: branch.id, name: branch.name },
        cta: "whatsapp",
      });
    }

    pageView();
    root.addEventListener("click", onClick);

    return () => {
      root.removeEventListener("click", onClick);
    };
  }, [branch, context, links, products]);

  return null;
}
