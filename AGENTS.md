# AGENTS.md

## KGJ Custom Link Bio + Meta Tracking Hub

This is a modular-monolith Link Bio and Meta Tracking Hub for Kotagede
Jewellery. Its P0 funnel is:

```text
Visitor → Link Bio → Product interest → Branch WhatsApp
```

P0 does not include CRM, leads, appointments, closing, purchase, revenue, or
sales management. Treat a request in those areas as a scope change.

## Sources of Truth

Read only the source document relevant to the task:

- Product scope, public/admin UX, tracking semantics, and acceptance:
  `docs/prd.md`.
- Architecture, integrations, security, operations, and deployment:
  `docs/system-architecture.md`.
- Schema, constraints, indexes, retention, and migrations:
  `docs/database-design.md`.

These documents, in that order, are authoritative. If an approved change alters
their contract, update the relevant document in the same logical change. Do not
silently redefine a documented requirement in code.

## Non-Negotiable Product Invariants

- The public Link Bio is mobile-first and routes product interest to the
  correct branch WhatsApp number.
- Tracking is best-effort: provider or internal-event failure must never block
  WhatsApp navigation.
- Tracking remains anonymous/pseudonymous. Do not collect customer identity or
  other PII unless the owner explicitly changes the P0 scope and documentation.
- Preserve canonical event names, attribution, event identity/deduplication,
  product-to-branch rules, and permission boundaries. For a related change,
  read the applicable source document first.
- Secrets and privileged credentials stay server-side and out of logs, public
  browser bundles, audit records, and commits. The owner explicitly approved
  one exception on 21 October 2026: the CMS may decrypt and render a branch
  CAPI access token and Test Event Code only to an authenticated
  `technical_admin`; never render either value to public visitors or another
  admin role.

## Mandatory Working Rules

1. Before every project task, including a new, resumed, or context-reset
   session, read this complete current `AGENTS.md` before taking any project
   action.
2. Before every software-engineering task, select the narrowest relevant Matt
   Pocock skill, read its complete `SKILL.md`, and follow its workflow. Add
   another skill only for a distinct scope.
3. For behaviour, business logic, data flow, permission, shared-code, bug, or
   refactor work, use Ponytail at `full` level: map callers, tests, fixtures,
   configuration, and user risk; then make the smallest complete change.
4. Use Graphify before understanding or changing non-trivial code or
   architecture. Read raw source only when Graphify lacks the required context.
   Update Graphify once after each completed logical change, before handoff.
5. For UI/UX work, run `impeccable context` once per session and use
   Impeccable.

## Additional Workflows and Tools

- When the relevant capability is installed, use Superpowers to plan a
  non-trivial change, trace a root cause, or verify the result. Combine its
  overlapping steps with the selected Matt Pocock skill and Ponytail so each
  analysis and validation is performed once.
- Apply Karpathy-style coding discipline to code work: state material
  assumptions, choose the simplest solution, keep the change within scope,
  and verify concrete acceptance criteria.
- When validating a web UI or user flow directly, use Agent Browser when it is
  available. After each navigation or DOM-changing action, take a fresh
  snapshot and use only references from that snapshot.
- Use Agent Desktop only when a test or E2E flow requires desktop interaction,
  an OS dialog, or a cross-application flow. Before using it, check its status
  and read its `get desktop` and `get platform` guidance. Run
  snapshot → action → fresh snapshot, then report the tested scenario, actual
  result, expected result, and any blocker.
- Read the complete `SKILL.md` for every relevant installed skill before using
  it. If a required skill or tool is unavailable, report that constraint and
  follow the failure rules below; do not invent a substitute or install one
  without approval.

## UI/UX Workflow

For UI/UX work, follow this sequence in addition to the mandatory rules:

1. Read `DESIGN.md`, the user requirement, and the affected existing UI
   patterns; run `impeccable context` once per session.
2. For a new interface, redesign, or unclear visual direction, use Inspo via
   MCP when it is available. Select references that fit the product and page
   goal, examine desktop and mobile layout, typography, colour, and spacing,
   then briefly cite the source and why it was adapted.
3. Use Impeccable for UI/UX quality and implementation consistency. Use
   Hallmark when it is available to establish visual character or audit generic
   patterns; merge overlapping checks with Impeccable.
4. Adapt references to the KGJ brand, `DESIGN.md`, existing components, and
   project stack. Small changes follow the established design; redesign only
   the requested page or component.
5. Validate the affected render, responsive layout, contrast, keyboard focus,
   and interactions. Use Agent Browser for web flows and Agent Desktop only for
   desktop or OS-dialog flows. Stop when the acceptance criteria are met.

## Change Discipline

- Make the smallest coherent change that fully satisfies the approved
  acceptance criteria. Stop when the criteria are met.
- State any assumption that materially affects the result; resolve all other
  safe details from the existing project.
- Preserve unrelated API contracts, URLs, schemas, permissions, UX flows,
  defaults, and existing behaviour.
- Reuse established architecture, conventions, components, utilities, and
  dependencies. Do not add dependencies when the current stack suffices.
- Do not perform unrelated refactors, cleanup, improvements, or initialization.
- If a change conflicts with a source-of-truth document or expands P0 scope,
  explain the conflict and obtain approval before implementation.

## Bug Discipline

1. Find the root cause, not only the symptom.
2. Trace callers, shared components, handlers, utilities, queries, tests, and
   flows that use the same pattern.
3. Fix every case with the same root cause. Report lookalike cases whose
   behaviour differs instead of changing them automatically.
4. Add or run proportionate regression coverage for the repaired behaviour.

## Data and Migration Safety

Existing data, including local data, is not disposable. Use forward-only,
non-destructive migrations by default. Before a migration, seed, or risky data
mutation, verify the environment and target, understand impact, and prefer a
non-destructive approach.

Without explicit owner approval, do not reset or recreate a database; run
`migrate:fresh`, database reset, `DROP DATABASE`, `DROP SCHEMA`, mass
`TRUNCATE`/`DELETE`; remove Docker database volumes; run destructive seeds;
create destructive migrations; or alter migrations used in shared, staging, or
production environments. If data loss is the only option, stop, explain the
risk, and request approval.

Deploy, build, startup, CI/CD, Dockerfile, entrypoint, and post-deploy paths
must not reset a database. Apply production migrations only as an explicit,
owner-approved operation; never during Vercel build or application startup.

## Performance

Optimise only when relevant to the task or a demonstrated bottleneck. Prefer,
in order: removing unnecessary work, efficient queries without N+1 access,
pagination for large datasets, minimal payloads and deduplicated requests,
clear-invalidation caching, lazy loading, image optimisation, then indexes or
advanced delivery techniques only for proven access patterns.

Public pages prioritise mobile performance, accessible semantics, minimal
client JavaScript, and image delivery at rendered size. Do not trade simplicity
for micro-optimisation.

## Verification

Test proportionally to risk. Prioritise business rules, permission/access
control, calculations, data mutation, database migration, shared behaviour, and
bug regression. Direct inspection may be sufficient for isolated documentation
or copy changes. Never claim a check passed unless it was run or inspected.

For source or deployable configuration changes, state the proposed verification
scope and reason before running checks; obtain owner approval for costly or
shared-service checks. The normal baseline is `pnpm typecheck` then `pnpm build`.
`pnpm quality:check` is the GitHub CI gate. Vercel runs only `pnpm build`; do
not run Vitest in its production build environment.

## Documentation, Ambiguity, and Failures

Ask for clarification only when an ambiguity could materially alter a business
rule, permission, destructive operation, data interpretation, scope, or one of
several valid behaviours. Resolve safe details from established code, tests,
documentation, design, and conventions.

Keep schema, migration, and deployment documentation aligned for database
changes. Put UI/UX documentation in `DESIGN.md` only when that document is
introduced or changed; do not create documentation merely to duplicate code.

If Graphify, Impeccable, Inspo, Hallmark, Agent Browser, Agent Desktop, a test,
build, or another required tool fails or is unavailable, report the command or
attempt and relevant error. Do not claim success, fabricate a replacement, or
install another tool without need and approval.

When rules conflict, use this order:

```text
1. Data safety
2. Security and permission
3. Correctness
4. Scope and acceptance criteria
5. Existing behaviour
6. Existing architecture
7. Regression prevention
8. Testing
9. Performance
10. Cleanup or improvement
```

## Handoff

After a completed logical change, update Graphify, report checks actually run,
state deferred work and remaining risk, and leave Git add/commit/push/pull to
the owner.

> **UNDERSTAND → TRACE → CHANGE MINIMALLY → PROTECT DATA → TEST → VALIDATE → STOP.**

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
