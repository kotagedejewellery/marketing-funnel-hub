# ADR-002: Authentication, data access, and security boundaries

## Status

Accepted

## Date

2026-09-15

## Context

The baseline selects Supabase Auth and defines `admin` and `technical_admin`
profiles, but it does not define their permissions, administrator bootstrap, the
browser/server database boundary, RLS behavior, Storage policies, or abuse controls
for public event ingestion.

## Decision

### Authentication and authorization

1. Public content and tracking endpoints are unauthenticated. Admin pages, Server
   Actions, and admin APIs require a server-validated Supabase session.
2. Every authenticated admin request must resolve an active `admin_profiles` row.
   Missing or inactive profiles receive `403 Forbidden`.
3. `admin` may manage public content, campaigns, products, branches, assignments,
   links, settings, and media, and may view tracking-validation data.
4. `technical_admin` has all `admin` permissions and may additionally provision or
   deactivate admin profiles and view technical integration diagnostics. Provider
   secrets remain environment-only and are never readable or editable in the CMS.
5. The first production `technical_admin` is provisioned by an explicit deployment
   runbook using Supabase administration plus a corresponding `admin_profiles` row.
   Credentials and production user IDs are never committed or placed in seed data.

### Database and Storage access

6. Application domain tables are accessed through server-side domain modules and
   Drizzle using a dedicated least-privilege application database role.
7. Browser Supabase clients may be used for Auth session operations. They do not
   query or mutate application domain tables directly in P0.
8. Enable RLS on application tables exposed through Supabase APIs and default to
   denying `anon` and `authenticated` direct table access. Server-side application
   access is granted explicitly to the dedicated database role.
9. Supabase Storage uses separate public-read asset buckets and authenticated
   admin-write policies. Uploads validate MIME type, extension, size, and generated
   object path server-side. Overwrites and deletes require authorization and an
   audit entry.

### Request security

10. Cookie-authenticated mutations enforce same-origin requests. Route Handlers
    validate `Origin` where applicable; Server Actions retain framework origin
    protection and still perform explicit authorization.
11. `POST /api/events` accepts at most 32 KiB. `metadata` is an optional JSON object
    capped at 4 KiB, with dangerous or unbounded nesting rejected.
12. The event endpoint accepts only the three canonical event names. It validates
    timestamp skew, UUID format, page URL origin, field lengths, and event-specific
    requirements. Product and branch identifiers are resolved against server data;
    Contact product/branch combinations must correspond to an active assignment.
13. Reusing an `eventId` with an equivalent canonical payload returns success with
    `duplicate: true`. Reusing it with a materially different payload returns
    `409 Conflict` and does not overwrite the stored event.
14. Apply deployment-edge rate limiting to `POST /api/events`, with conservative
    per-IP and global burst limits configurable by environment. Validation and
    database uniqueness remain mandatory because rate limiting is not a trust
    boundary. Do not add Redis solely for P0 rate limiting.
15. Validate and sanitize all third-party responses before logging or exposing any
    diagnostic result. Never return provider bodies or stack traces to public users.

## Alternatives considered

### Direct browser access to domain tables

Rejected because it creates two authorization paths, weakens the Drizzle/domain
boundary, and makes audit-log enforcement easier to bypass.

### Editable provider secrets in the CMS

Rejected because Marketing does not need secret access and database-backed secrets
would broaden the breach surface.

### Enterprise RBAC

Rejected as unnecessary for two P0 roles. The explicit capability matrix above is
small enough to enforce directly and test exhaustively.

## Consequences

- Admin authorization is deterministic and testable.
- RLS remains defense in depth rather than the primary business-authorization layer.
- Storage and domain mutations share the same server-side authorization boundary.
- Deployment must provide an edge rate-limit facility and an administrator
  bootstrap runbook before production.
- Exact rate thresholds remain environment configuration and require traffic
  estimates before launch, not before scaffolding.
