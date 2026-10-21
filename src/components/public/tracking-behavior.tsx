"use client";

import { useEffect, useRef } from "react";

import { clientEnv } from "@/lib/env/client";
import type { BrowserMetaTrackingConfig } from "@/modules/tracking/branch-meta-config";
import type { CanonicalEvent } from "@/modules/tracking/event";
import { resolveMetaProviderEvent } from "@/modules/tracking/meta-event";

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
  __kgjMetaPixelIds?: Set<string>;
};

function loadProviderScript(id: string, src: string) {
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.async = true;
  script.src = src;
  document.head.append(script);
}

function activateProviders(metaPixelId: string | null) {
  if (clientEnv.NEXT_PUBLIC_APP_ENV !== "production" || !metaPixelId)
    return false;
  const browser = window as ProviderWindow;
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
    loadProviderScript(
      "kgj-meta-pixel",
      "https://connect.facebook.net/en_US/fbevents.js",
    );
  }
  const initializedIds = (browser.__kgjMetaPixelIds ??= new Set());
  if (!initializedIds.has(metaPixelId)) {
    browser.fbq("init", metaPixelId);
    initializedIds.add(metaPixelId);
  }
  browser.fbq("consent", "grant");
  return true;
}

function sendEvent(
  event: CanonicalEvent,
  metaTracking: BrowserMetaTrackingConfig,
) {
  const browser = window as ProviderWindow;
  const metaEvent = resolveMetaProviderEvent(
    event.eventName,
    metaTracking.pageLoadMetaEvent,
  );

  if (metaEvent && activateProviders(metaTracking.pixelId)) {
    try {
      browser.fbq!(
        metaEvent.type === "custom" ? "trackSingleCustom" : "trackSingle",
        metaTracking.pixelId,
        metaEvent.name,
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
  metaTracking,
}: {
  context: TrackingContext;
  products: TrackingProduct[];
  links: TrackingLink[];
  branch: { id: string; name: string };
  metaTracking: BrowserMetaTrackingConfig;
}) {
  const pageViewSent = useRef(false);

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
      if (pageViewSent.current) return;
      pageViewSent.current = true;
      sendEvent(
        {
          ...baseEvent(),
          eventName: "PageView",
          product: null,
          branch: null,
          cta: null,
        },
        metaTracking,
      );
    }

    function onClick(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;
      const anchor = event.target.closest<HTMLAnchorElement>("a[data-track]");
      if (!anchor || !root?.contains(anchor)) return;
      const link = linksById.get(anchor.dataset.trackLinkId ?? "");
      if (link) {
        sendEvent(
          {
            ...baseEvent(),
            eventName: "LinkClick",
            product: null,
            branch,
            cta: "link",
            link,
          },
          metaTracking,
        );
        return;
      }
      const productCard = anchor.closest<HTMLElement>(
        "article[data-track-product-id]",
      );
      const product = byId.get(productCard?.dataset.trackProductId ?? "");
      const productBranch = product?.branches.find(
        (item) => item.id === anchor.dataset.trackBranchId,
      );
      if (!product || !productBranch) return;
      sendEvent(
        {
          ...baseEvent(),
          eventName: "Contact",
          product: { id: product.id, category: product.slug },
          branch: { id: productBranch.id, name: productBranch.name },
          cta: "whatsapp",
        },
        metaTracking,
      );
    }

    pageView();
    root.addEventListener("click", onClick);

    return () => {
      root.removeEventListener("click", onClick);
    };
  }, [branch, context, links, metaTracking, products]);

  return null;
}
