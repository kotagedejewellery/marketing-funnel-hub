# Implementation Plan: Sprint 0 Foundation and Environment

## Status

In progress — T0-01 through T0-10 are complete (GitHub verification reported by
the repository owner). T0-11 was retired by the local/live decision now recorded
in `docs/system-architecture.md`; T0-12 remains in progress.
Git and host firewall operations remain user-managed; the owner subsequently
authorized local Docker/database work for Sprint 1.

## Objective

Create a reproducible, secure, testable foundation for the KGJ P0 modular monolith
without implementing public, CMS, database-domain, or tracking features. Sprint 0
ends when the empty application shell, local services, quality gates, and
operating runbooks are proven.

## Scope boundaries

Sprint 0 includes repository initialization, pinned tooling, the minimal Next.js
shell, Tailwind/shadcn foundations, validation and test harnesses, Supabase Local,
Drizzle connectivity, Auth/Storage client boundaries, and CI.

Sprint 0 excludes domain tables, CMS screens, public product UI, canonical event
behavior, provider integrations, production migrations, and real production secrets.

## Accepted architecture decisions

The original ADR decisions are consolidated in `docs/system-architecture.md` and
`docs/database-design.md`: App Router/Node, server-side access and RLS, canonical
tracking and WhatsApp-safe delivery, Product–Branch rules, risk-based verification,
and local/live-only environments. No separate ADR files remain.

## Dependency graph

```text
T0-01 Repository baseline (user-managed; execution-order exception granted)
  ↓
T0-02 Toolchain versions
  ↓
T0-03 Minimal Next.js shell
  ├─→ T0-04 Styling/admin UI foundation
  ├─→ T0-05 Environment contract
  └─→ T0-06 Test harnesses

T0-02 → T0-07 Supabase Local
T0-05 + T0-07 → T0-08 Drizzle connectivity
T0-05 + T0-07 → T0-09 Supabase Auth/Storage boundaries

T0-04 + T0-06 + T0-08 + T0-09
  ↓
T0-10 CI quality gates
  ↓
T0-12 Sprint 0 completion checkpoint
```

## Task order

### Phase A — Reproducible application shell

- [x] T0-01: Initialize repository and documentation baseline
- [x] T0-02: Select and pin the supported toolchain
- [x] T0-03: Create the minimal Next.js App Router shell
- [x] T0-04: Establish Tailwind and shadcn/ui foundations

### Checkpoint A

- [x] Repository history starts from the normalized documentation baseline.
- [x] A clean checkout installs reproducibly and starts the empty application.
- [x] No product, CMS, database-domain, or tracking feature has been introduced.

### Phase B — Local platform and verification

- [x] T0-05: Define and validate the environment contract
- [x] T0-06: Establish unit, component, and browser test harnesses
- [x] T0-07: Initialize Supabase Local (owner-managed host firewall; no external probe)
- [x] T0-08: Establish Drizzle connectivity and migration harness
- [x] T0-09: Establish Supabase Auth and Storage client boundaries

### Checkpoint B

- [ ] Local application, PostgreSQL, Auth, and Storage start without production data.
- [ ] Empty migration and connectivity checks pass from a clean environment.
- [ ] Unit, component, and browser smoke tests pass.

### Phase C — Automated delivery foundation

- [x] T0-10: Add CI quality gates (GitHub gate verification owner-reported)
- T0-11: Retired by the local/live decision; no staging/Preview validation required.
- [ ] T0-12: Complete Sprint 0 documentation and readiness review

### Checkpoint C

- [ ] Pull-request quality gates pass.
- [ ] Local-only tests and CI use no live Supabase credentials.
- [ ] Environment, migration, rollback, admin-bootstrap, and secret-ownership runbooks
      are reviewed.
- [ ] Human approval is recorded before Sprint 1.

## Parallelization

After T0-03, T0-04 and T0-06 may proceed independently. After T0-05 and T0-07,
T0-08 and T0-09 may proceed independently. Version selection, shared configuration,
lockfile changes, migrations, and CI integration remain sequential to avoid conflicts.

## Risks and mitigations

| Risk                                           | Impact | Mitigation                                                                |
| ---------------------------------------------- | ------ | ------------------------------------------------------------------------- |
| Unsupported framework/runtime combination      | High   | Verify Vercel and framework support, then pin exact versions and lockfile |
| Local tests touch live data                    | High   | Keep test URLs local and reject remote migration targets                  |
| Drizzle path bypasses intended access controls | High   | Dedicated least-privilege role plus explicit RLS/direct-access tests      |
| Tooling overwhelms the greenfield baseline     | Medium | Install only the accepted stack; no feature libraries in Sprint 0         |
| CI differs from local execution                | Medium | Use the same pnpm scripts and clean-service startup in both environments  |
| External account setup blocks automation       | Medium | Isolate repository work and document the exact user-owned connection step |

## Decisions recorded during Sprint 0

The following are execution records, not reopened architecture choices:

- exact Node.js and package versions selected under the system architecture;
- named owner for live Supabase, provider accounts, migrations, and releases;
- environment-variable inventory without secret values;
- initial deployment-edge rate-limit thresholds for later `/api/events` work;
- alert destinations and escalation owner.

## P0 implementation closeout (21 September 2026)

The public Link Bio, CMS, product–branch WhatsApp flow, canonical tracking,
admin-profile management, and bounded event-retention endpoint are implemented.
The owner designated the local funnel check as the final agent-owned P0 step.
It passed on 21 September 2026: the active product → branch → WhatsApp CTA
and consented `PageView`/`ViewContent`/`Contact` were checked in one browser
flow. P0 application implementation is therefore closed locally.

Live release remains a separate owner-managed activity: resolve the Vercel
Hobby/private-repository deploy block, approve domain/content/consent and
provider setup, configure live Auth/Storage/environment/WAF/retention, then
deploy and verify the live funnel. None of those live actions or checks are
claimed complete by the local P0 implementation closeout.

Git operations, Vercel account/plan decisions, provider accounts, and live
activation remain owner-managed. No P1/P2 feature or staging environment is
needed for this implementation closeout.

## Approved extension: Link Bio per branch (22 September 2026)

This is a new feature after the local P0 closeout, not a reopening of the
completed P0 checklist. The owner approved a customizable page for each branch
and explicitly chose to keep `/` as the combined page. The feature contract is
in the three source-of-truth docs; implementation has not started yet.

### Objective and boundaries

Marketing can publish `/b/{branch-slug}` using the same KGJ template with
branch-specific text, logo, campaign, links, section order, and assigned-product
display overrides. Products/categories, branch phone numbers, auth roles,
consent, and the three event names remain shared/canonical. No page builder,
per-branch app/database, redirect registry, new provider, or CRM scope.

Assumptions made explicit: empty branch text/image overrides inherit global
values; branch campaigns/links do not inherit global rows; branch section
settings inherit the global set until first saved; branch slug is a stable
public URL and changing it needs a CMS warning. These choices keep the content
separate without creating a new design system or additional tables.

### Structure, commands, and style

- Schema/migrations: `src/lib/db/schema.ts`, `drizzle/`; generate with
  `pnpm db:generate`, then owner-approved local migration using
  `pnpm db:migrate:local`. Live migration is reviewed and run by the owner via
  `pnpm db:migrate:live` before deployment.
- Public read/route: `src/modules/public-content/`, `src/app/b/[slug]/`, and
  existing `src/components/public/`. Tracking changes stay in
  `src/modules/tracking/`, `src/app/api/events/`, and `src/proxy.ts`.
- CMS: existing `src/modules/admin/` actions/validation and
  `src/app/admin/(cms)/` pages. Reuse existing modal, toast, media, and audit
  patterns. Strict TypeScript, Drizzle snake_case DB mapping, Zod at untrusted
  boundaries, and no new dependency. Example contract: an inactive branch or
  inactive product assignment yields no public CTA.
- Verification to request before running: `pnpm typecheck`, focused public
  content/tracking tests, one local branch-page → WhatsApp check, and local
  migration inspection. Do not run these or a full suite without owner consent.

### Dependency order and release checkpoint

1. Additive schema/migration while old `/` remains compatible.
2. Branch read model and route, with active filtering and direct WhatsApp CTA.
3. Path-aware signed journey and event validation; preserve canonical events.
4. CMS branch identity/sections, then branch campaigns/links and product display
   overrides, each with Zod, audit, and targeted invalidation.
5. Owner-approved focused verification; owner performs live migration first,
   then deploys code and checks the live branch funnel. No automatic live write.

Risk: changing a shared slug breaks a published URL; warn at edit time and keep
slug stable operationally. Risk: branch content leaks to `/` or another branch;
every read/write uses an explicit scope and root rows retain `branch_id = NULL`.
Risk: event payloads could claim a different branch from their page URL; server
resolves the active page branch and validates Contact against it. A tracking
failure still cannot block the final WhatsApp anchor.
