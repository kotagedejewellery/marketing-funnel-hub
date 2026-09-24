export const consentCookieName = "kgj_consent";
export const consentChangedEventName = "kgj:consent-changed";
export const consentMaxAgeSeconds = 30 * 24 * 60 * 60;

export type ConsentChoice = {
  analytics: boolean;
  marketing: boolean;
};

export function parseConsentCookie(
  value: string | undefined,
): ConsentChoice | null {
  const match = /^v1\.a([01])\.m([01])$/.exec(value ?? "");
  if (!match) return null;
  return { analytics: match[1] === "1", marketing: match[2] === "1" };
}

export function encodeConsentCookie(choice: ConsentChoice): string {
  return `v1.a${Number(choice.analytics)}.m${Number(choice.marketing)}`;
}
