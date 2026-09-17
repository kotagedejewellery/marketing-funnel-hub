# Implementation Plan: Sprint 0 Foundation and Environment

## Status

In progress — T0-01 through T0-09 are complete. T0-10 is configured and awaiting
GitHub-hosted verification. Git operations for T0-01 remained user-managed;
Docker and host firewall remain user-managed. T0-11 onward remains planned.

## Objective

Create a reproducible, secure, testable foundation for the KGJ P0 modular monolith
without implementing public, CMS, database-domain, or tracking features. Sprint 0
ends when the empty application shell, local services, quality gates, staging
connection, and operating runbooks are proven.

## Scope boundaries

Sprint 0 includes repository initialization, pinned tooling, the minimal Next.js
shell, Tailwind/shadcn foundations, validation and test harnesses, Supabase Local,
Drizzle connectivity, Auth/Storage client boundaries, CI, and preview deployment.

Sprint 0 excludes domain tables, CMS screens, public product UI, canonical event
behavior, provider integrations, production migrations, and real production secrets.

## Accepted architecture decisions

- ADR-001: App Router, server-first rendering, Node runtime for privileged paths,
  pnpm, and exact version pinning.
- ADR-002: server-side domain access, least-privilege database role, RLS defense in
  depth, explicit role checks, and protected Storage writes.
- ADR-003: canonical event ownership and consent-aware, WhatsApp-safe delivery; only
  interfaces required by later sprints are prepared here.
- ADR-004: normalized Product/Contact/content contracts; no domain implementation in
  Sprint 0.
- ADR-005: Vitest, Testing Library, Playwright, CI gates, isolated environments, and
  controlled migration/deployment workflows.

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
T0-11 Vercel preview/staging validation
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

- [ ] T0-10: Add CI quality gates (workflow configured; GitHub gate verification pending)
- [ ] T0-11: Validate Vercel preview with staging-only services
- [ ] T0-12: Complete Sprint 0 documentation and readiness review

### Checkpoint C

- [ ] Pull-request quality gates pass.
- [ ] Preview deploys without production credentials.
- [ ] Environment, migration, rollback, admin-bootstrap, and secret-ownership runbooks
  are reviewed.
- [ ] Human approval is recorded before Sprint 1.

## Parallelization

After T0-03, T0-04 and T0-06 may proceed independently. After T0-05 and T0-07,
T0-08 and T0-09 may proceed independently. Version selection, shared configuration,
lockfile changes, migrations, and CI integration remain sequential to avoid conflicts.

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Unsupported framework/runtime combination | High | Verify Vercel and framework support, then pin exact versions and lockfile |
| Preview receives production credentials | High | Separate staging variables and automated environment validation |
| Drizzle path bypasses intended access controls | High | Dedicated least-privilege role plus explicit RLS/direct-access tests |
| Tooling overwhelms the greenfield baseline | Medium | Install only the accepted stack; no feature libraries in Sprint 0 |
| CI differs from local execution | Medium | Use the same pnpm scripts and clean-service startup in both environments |
| External account setup blocks automation | Medium | Isolate repository work and document the exact user-owned connection step |

## Decisions recorded during Sprint 0

The following are execution records, not reopened architecture choices:

- exact Node.js and package versions selected under ADR-001;
- named owners for staging, production, provider accounts, migrations, and releases;
- environment-variable inventory without secret values;
- initial deployment-edge rate-limit thresholds for later `/api/events` work;
- alert destinations and escalation owner.
