import "server-only";

import { createHash } from "node:crypto";

const attempts = new Map<string, { count: number; resetAt: number }>();
const windowMs = 10 * 60 * 1000;
const limit = 10;

export function canSubmitForm(request: Request, formId: string) {
  // shortcut: process-local fallback; Traefik is the shared production limiter.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const key = createHash("sha256").update(`${ip}:${formId}`).digest("hex");
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

export function resetFormSubmissionRateLimitForTest() {
  attempts.clear();
}
