import type { CanonicalEvent } from "./event";

export const metaStandardEventNames = [
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
] as const;

export type MetaStandardEventName = (typeof metaStandardEventNames)[number];

type MetaProviderEvent = {
  name: string;
  type: "standard" | "custom";
};

export function parseMetaStandardEventName(
  value: string | null,
): MetaStandardEventName | null {
  return metaStandardEventNames.includes(value as MetaStandardEventName)
    ? (value as MetaStandardEventName)
    : null;
}

export function resolveMetaProviderEvent(
  eventName: CanonicalEvent["eventName"],
  pageLoadMetaEvent: MetaStandardEventName | null,
): MetaProviderEvent | null {
  if (eventName === "PageView") {
    return pageLoadMetaEvent
      ? { name: pageLoadMetaEvent, type: "standard" }
      : null;
  }
  if (eventName === "Contact") return { name: "Contact", type: "standard" };
  return { name: "LinkClick", type: "custom" };
}
