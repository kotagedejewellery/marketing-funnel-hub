# ADR-001: Runtime and application boundaries

## Status

Accepted

## Date

2026-09-15

## Context

The locked stack selects Next.js, TypeScript, React, Tailwind CSS, shadcn/ui,
Supabase, Drizzle ORM, and Vercel, but it does not define the runtime baseline,
package-management policy, rendering boundary, or which Next.js interface owns
each operation. Those choices affect security, caching, testability, and deployment.

## Decision

1. Use the Next.js App Router under `src/app` with strict TypeScript.
2. Use the Node.js runtime for routes and actions that access PostgreSQL, Supabase
   Auth, Storage administration, internal events, or Meta CAPI. Do not target the
   Edge runtime for these paths in P0.
3. Use Server Components by default for the public page. Add Client Components
   only for product disclosure, attribution/session initialization, tracking, and
   other interactions that require browser APIs.
4. Use Server Actions for authenticated admin mutations and Route Handlers for
   explicit HTTP boundaries such as `POST /api/events`.
5. Treat `GET /api/public/config` as an internal DTO contract. The initial public
   page renders directly from the server and does not make a second client-side
   configuration request.
6. Cache only shared public content. Every successful admin content mutation must
   invalidate the relevant public-content cache. Session state and event writes
   are never shared-cacheable.
7. Use `pnpm` and commit its lockfile. At Sprint 0, select the current
   Vercel-supported Active LTS Node.js release and current stable compatible majors
   of Next.js, React, Tailwind CSS, and shadcn/ui; then pin the Node major and exact
   dependency versions in repository configuration. Floating majors are forbidden.
8. Avoid a global client state library in P0. Server data, URL state, component
   state, and small focused context providers are sufficient until demonstrated
   otherwise.

## Alternatives considered

### Client-rendered public configuration

Rejected because it adds a request, more client JavaScript, and a loading state to
the highest-priority conversion surface.

### Separate backend service

Rejected because it conflicts with the locked modular-monolith architecture and
adds deployment and operational overhead without a P0 requirement.

### Edge runtime for tracking

Rejected for the initial implementation because database, authentication, and
provider-library compatibility are simpler and more predictable in the Node.js
runtime. This can be reconsidered only with measured latency evidence.

## Consequences

- The public page remains server-first and lightweight.
- Admin and public code share domain modules without exposing server internals.
- Explicit HTTP contracts remain limited and stable.
- Sprint 0 must record the exact selected versions before dependency installation.
- Cache invalidation becomes part of every content mutation's acceptance criteria.
