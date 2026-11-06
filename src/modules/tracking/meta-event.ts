import * as z from "zod";

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

export const metaCtaEventOverrideSchema = z
  .string()
  .trim()
  .max(100, "Nama event Meta maksimal 100 karakter.")
  .refine(
    (value) => value === "" || /^[A-Za-z][A-Za-z0-9_]*$/.test(value),
    "Gunakan huruf, angka, atau garis bawah; nama harus diawali huruf.",
  )
  .refine(
    (value) => value !== "PageView",
    "PageView hanya dikirim saat halaman dibuka.",
  )
  .transform((value) => value || null);

type MetaProviderEvent = {
  name: string;
  type: "standard" | "custom";
};

export function parseMetaCtaEventOverride(value: string | null | undefined) {
  const parsed = metaCtaEventOverrideSchema.safeParse(value ?? "");
  return parsed.success ? parsed.data : null;
}

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
  ctaMetaEventOverride?: string | null,
): MetaProviderEvent {
  if (event.eventName === "PageView")
    return { name: "PageView", type: "standard" };
  const configuredEvent = parseMetaCtaEventOverride(ctaMetaEventOverride);
  if (event.eventName === "Contact" && event.cta === "whatsapp") {
    const name = configuredEvent ?? whatsappCtaMetaEvent ?? "Contact";
    return {
      name,
      type: parseMetaStandardEventName(name) ? "standard" : "custom",
    };
  }
  if (event.eventName === "LinkClick" && configuredEvent)
    return {
      name: configuredEvent,
      type: parseMetaStandardEventName(configuredEvent) ? "standard" : "custom",
    };
  return { name: "LinkClick", type: "custom" };
}
