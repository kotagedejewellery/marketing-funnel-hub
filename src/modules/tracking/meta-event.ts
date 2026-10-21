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

export const metaCtaEventNames = [
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

export type MetaCtaEventName = (typeof metaCtaEventNames)[number];

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

export function parseMetaCtaEventName(
  value: string | null,
): MetaCtaEventName | null {
  return metaCtaEventNames.includes(value as MetaCtaEventName)
    ? (value as MetaCtaEventName)
    : null;
}

export function resolveMetaProviderEvent(
  event: Pick<CanonicalEvent, "eventName" | "cta">,
  whatsappCtaMetaEvent: MetaCtaEventName | null,
): MetaProviderEvent {
  if (event.eventName === "PageView")
    return { name: "PageView", type: "standard" };
  if (event.eventName === "Contact" && event.cta === "whatsapp") {
    return {
      name: whatsappCtaMetaEvent ?? "Contact",
      type: "standard",
    };
  }
  return { name: "LinkClick", type: "custom" };
}
