# ADR-003: Tracking session, attribution, and delivery

## Status

Accepted

## Date

2026-09-15

## Context

P0 requires internal events, Meta Pixel and CAPI deduplication, GTM/GA4, persistent
attribution, and an immediate WhatsApp journey. The baseline does not define a
session lifetime, attribution overwrite rule, consent boundary, provider ownership,
or a delivery sequence that can preserve normal link behavior when JavaScript,
analytics, or the event API fails.

## Decision

### Anonymous journey and attribution

1. Represent an anonymous journey with a random UUID in a first-party `kgj_sid`
   cookie. Use `Secure` in production, `SameSite=Lax`, `Path=/`, and a rolling
   30-minute inactivity lifetime. Do not fingerprint or attempt cross-device identity.
2. Keep attribution in a signed first-party session cookie containing only the five
   UTM fields. Do not create session or attribution database tables.
3. The first non-empty UTM set starts the journey attribution. Empty/direct visits
   never erase it. A later landing with a different explicit UTM set starts a new
   journey ID and attribution context. Internal navigation never changes attribution.
4. Generate canonical `eventTime` in the browser as close to the action as possible,
   while recording server receipt time separately as the database `created_at`.
5. Do not put tracking identifiers or UTM values into the customer-visible WhatsApp
   message.

### Canonical event ownership

6. A focused application tracking module constructs the canonical event once. Meta
   Pixel, GTM, GA4, internal persistence, and Meta CAPI consume mappings from that
   event; no provider derives product, branch, or attribution from DOM text.
7. Browser code generates one UUID `eventId` per logical action. The same canonical
   event and ID are sent to browser providers and `POST /api/events`.
8. `POST /api/events` is the only public server event boundary. `/api/meta/capi` is
   not a public endpoint in P0; Meta mapping and dispatch are internal server modules.
9. Send PageView, ViewContent, and Contact to Meta CAPI when Meta marketing tracking
   is enabled. Every browser/server pair uses the same Meta event name and event ID.
10. GA4 is dispatched through GTM only. Do not also initialize an independent direct
    GA4/`gtag` event path, which would risk duplicate analytics events.

### WhatsApp-safe delivery

11. Render each WhatsApp CTA as a normal anchor with its final validated `wa.me` URL.
    JavaScript is an enhancement and must not be required for navigation.
12. On Contact click, synchronously construct the canonical event and push the
    consented browser-provider events, then issue a best-effort `fetch` to
    `POST /api/events` using `keepalive`. Do not call `preventDefault`, await the
    request, show an interstitial, or delay navigation.
13. The event endpoint validates the request, attempts the idempotent internal insert
    first, and dispatches Meta CAPI with a short bounded timeout. A transient CAPI
    retry may occur once and must reuse the same event ID. P0 does not add a durable
    queue or promise guaranteed external delivery.
14. Internal storage, Pixel, GTM/GA4, and CAPI failures are isolated from each other.
    Failure in any destination never changes or cancels the WhatsApp URL.
15. The admin tracking-validation view reports canonical internal events only.
    Provider delivery is verified through sanitized application logs and provider
    diagnostic tools. Persistent per-provider delivery state is deferred unless a
    separate delivery table is approved.

### Privacy and consent

16. Safe default: external Meta and GA4/GTM tracking is disabled until the visitor's
    applicable analytics/marketing consent state permits it. Consent behavior and
    notice copy require business/legal approval before production activation.
17. `_fbp`, `_fbc`, request IP, and user-agent may be forwarded to Meta only when the
    approved consent policy permits it. They are transport-only and must not be stored
    in `events`, audit logs, or ordinary application logs.
18. Internal anonymous-event activation before consent is a policy decision for the
    business/legal owner. Until approved, default to recording only after the
    applicable consent state permits it.

## Alternatives considered

### Await tracking before WhatsApp navigation

Rejected because network and provider latency would become customer-journey latency,
directly violating the locked reliability requirement.

### Fire-and-forget background work after returning the server response

Rejected as a delivery guarantee because serverless runtimes may stop work after the
request lifecycle. Provider dispatch remains bounded within the event request, while
the browser does not wait for that request.

### Durable queue and provider-delivery table

Deferred because the locked P0 architecture excludes queue infrastructure and the
current business event volume has not demonstrated a need. Revisit if measured loss
or retry requirements justify it.

## Consequences

- WhatsApp remains functional with disabled JavaScript and complete analytics failure.
- Internal and external event delivery is explicitly best-effort in P0.
- Meta browser/server deduplication has a single owner and identifier.
- GA4 duplication risk is reduced by having GTM own GA4 dispatch.
- Marketing tracking cannot be activated in production until the consent decision is
  accepted and documented.
