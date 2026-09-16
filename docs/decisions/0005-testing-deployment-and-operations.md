# ADR-005: Testing, deployment, and operational baseline

## Status

Accepted

## Date

2026-09-15

## Context

The sprint plan names test scenarios and deployment stages but does not select test
layers, CI gates, environment topology, migration ownership, rollback behavior,
performance targets, retention execution, or the minimum observable production
signals.

## Decision

### Test strategy

1. Use Vitest for TypeScript unit and module tests, Testing Library for interactive
   React behavior, and Playwright for browser and end-to-end tests.
2. Run database integration tests against a clean local Supabase/PostgreSQL instance
   created from Drizzle migrations. Do not mock relational constraints in tests that
   claim to validate database behavior.
3. Unit-test domain rules: active filtering, campaign selection, Product–Branch
   resolution, message/CTA fallback, URL generation, event variants, attribution,
   and idempotency conflict detection.
4. Integration-test authentication/authorization, admin mutations plus audit logs,
   Storage policies, event persistence, duplicate events, and database constraints.
5. Browser-test the canonical paid and organic journeys, Instagram-sized mobile
   viewport behavior, WhatsApp fallback when JavaScript/tracking fails, keyboard
   access, and visible admin validation.
6. Provider adapters use validated fixtures and fakes in automated CI. Real Meta,
   GTM, and GA4 validation occurs only in non-production provider test/debug modes
   and in the explicit launch checklist.
7. Critical domain and tracking branches require direct behavioral tests. A global
   percentage target does not replace the documented acceptance matrix.

### Quality gates

8. Every pull request must pass formatting check, lint, strict typecheck, unit tests,
   database integration tests, and production build. Run the focused Playwright smoke
   suite before merge; run the full cross-browser launch suite before production.
9. Public-page targets at launch are p75 LCP at or below 2.5 seconds, INP at or below
   200 milliseconds, CLS at or below 0.1, and no CTA dependency on third-party
   scripts. Test on representative mobile throttling, not desktop-only conditions.
10. Target WCAG 2.2 AA for the public journey and admin forms, including focus,
    labels, contrast, semantic controls, and keyboard operation.

### Environments and deployment

11. Maintain three data/tracking boundaries: local, staging, and production. Vercel
    preview deployments use staging Supabase and provider test configuration; no
    preview uses production database credentials or production provider tokens.
12. Initialize Git before Sprint 0 work and use GitHub as the deployment source.
    Protect the production branch with the quality gates above and an approval step.
13. Do not run production database migrations implicitly during a Vercel application
    build. A separately approved deployment job applies reviewed Drizzle migrations
    to staging, runs smoke tests, and then promotes them to production before the
    compatible application release.
14. Prefer backward-compatible expand/contract schema changes. Application rollback
    uses the previous Vercel deployment only while the schema remains compatible;
    destructive schema recovery uses a reviewed forward-fix or documented database
    restore procedure, never an automatic down migration.
15. Environment configuration is parsed and validated at startup. Maintain an
    `.env.example` containing names and descriptions but no values. Distinguish
    public analytics IDs from server-only database, Auth administration, Storage,
    CAPI, and scheduled-job credentials.

### Operations

16. Emit structured, sanitized server logs with `event_id`, provider, operation,
    error category, environment, and timestamp where applicable. Never log request
    cookies, tokens, full provider payloads, IP addresses, or user agents.
17. Before launch, define alerts for sustained internal event-insert failures, Meta
    CAPI failures/timeouts, admin mutation failures, and elevated server-error rate.
    Thresholds are environment configuration informed by staging traffic.
18. Enforce the 24-month event policy with an authenticated scheduled server job that
    deletes expired events in bounded batches and logs only counts and job status.
    The job is disabled until tested in staging and protected by a dedicated secret.
19. Backups, restore verification, domain/DNS ownership, analytics property/container
    ownership, and the administrator bootstrap procedure are mandatory launch-runbook
    items.

## Alternatives considered

### Unit tests only

Rejected because RLS, migrations, database uniqueness, browser navigation, and
provider-failure isolation cannot be proven by unit tests alone.

### Migrate during application startup or build

Rejected because concurrent deployments and failed builds can leave production
schema state unpredictable.

### Automatic destructive down migrations

Rejected because rollback can destroy data and may not match a still-running
application version. Backward-compatible changes and reviewed recovery are safer.

## Consequences

- Sprint 0 has an explicit tool and CI baseline without installing anything early.
- Database and browser behavior are tested at the layers where they can actually fail.
- Production schema changes have a controlled owner and promotion path.
- Retention and monitoring are launch requirements rather than undocumented future
  work.
- Exact alert thresholds and pinned package versions are recorded during Sprint 0
  and reviewed before production.
