# Sprint 0 Task Checklist

## Status

In progress — T0-01 through T0-09 are complete. T0-10 is configured and awaiting
GitHub-hosted verification. Git operations for T0-01 remained user-managed;
Docker and host firewall remain user-managed. T0-11 onward remains planned.

## T0-01: Initialize repository and documentation baseline

**Description:** Initialize Git and make the normalized documentation the first
reviewable project baseline before generated application files are introduced.

**Acceptance criteria:**
- [x] Git is initialized with an agreed default branch and safe `.gitignore`.
- [x] Current source documents, accepted ADRs, and task plans are committed together.
- [x] No application scaffold or secret is included in the baseline commit.

**Verification:**
- [x] `git status --short` is clean after the baseline commit.
- [x] `git log -1 --stat` contains documentation/planning files only.

**Completion note:** The user confirmed T0-01 complete on 2026-09-16. Git checks
and repository operations remained user-managed; Codex did not run Git commands.

**Dependencies:** None

**Files likely touched:** `.gitignore`, `.editorconfig`, `README.md`

**Estimated scope:** Small

## T0-02: Select and pin the supported toolchain

**Description:** Select current stable versions compatible with Vercel and ADR-001,
then make installation reproducible with pnpm.

**Acceptance criteria:**
- [x] Node major and exact Next.js/React/Tailwind/shadcn-compatible versions are recorded.
- [x] `packageManager`, engine policy, pnpm lockfile, and Node version file agree.
- [x] A clean install does not use floating dependency majors.

**Verification:**
- [x] `pnpm install --frozen-lockfile` succeeds from a clean dependency directory.
- [x] `node --version` and `pnpm --version` match repository policy.

**Dependencies:** The user explicitly authorized an execution-order exception for
T0-02 and T0-03 on 2026-09-15, then confirmed T0-01 complete on 2026-09-16.

**Files likely touched:** `package.json`, `pnpm-lock.yaml`, `.nvmrc`, `.npmrc`

**Estimated scope:** Small

## T0-03: Create the minimal Next.js App Router shell

**Description:** Create only the smallest server-first application shell needed to
prove the selected runtime and build pipeline.

**Acceptance criteria:**
- [x] App Router runs under `src/app` with strict TypeScript.
- [x] The root page is a neutral foundation placeholder with no P0 feature behavior.
- [x] Privileged server paths default to the Node.js runtime.

**Verification:**
- [x] `pnpm typecheck` passes.
- [x] `pnpm build` passes.
- [x] Manual check confirms the root page renders locally without console errors.

**Dependencies:** T0-02

**Files likely touched:** `src/app/layout.tsx`, `src/app/page.tsx`,
`src/app/globals.css`, `next.config.ts`, `tsconfig.json`

**Estimated scope:** Medium

## T0-04: Establish Tailwind and shadcn/ui foundations

**Description:** Configure the accepted styling stack without creating product or
admin feature components.

**Acceptance criteria:**
- [x] Tailwind processes the App Router source tree and exposes explicit base tokens.
- [x] shadcn/ui configuration targets admin use and does not dictate public branding.
- [x] No decorative design system or unused component collection is generated.

**Verification:**
- [x] `pnpm build` passes with the styling pipeline enabled.
- [x] One minimal style smoke assertion verifies generated styles load.

**Dependencies:** T0-03

**Files likely touched:** `src/app/globals.css`, `components.json`,
`src/lib/utils.ts`, `package.json`

**Estimated scope:** Small

## T0-05: Define and validate the environment contract

**Description:** Separate public and server-only configuration and fail safely when
required values are absent or malformed.

**Acceptance criteria:**
- [x] Zod schemas distinguish local, staging, and production requirements.
- [x] Public IDs are separated from database, Auth administration, Storage, CAPI,
  rate-limit, and scheduled-job secrets.
- [x] `.env.example` documents every variable name and owner without values.

**Verification:**
- [x] Unit tests cover valid configuration, missing required values, and public/server separation.
- [x] A production build fails with a sanitized configuration error when required values are absent.

**Dependencies:** T0-03

**Files likely touched:** `.env.example`, `src/lib/env/server.ts`,
`src/lib/env/client.ts`, `src/lib/env/env.test.ts`

**Estimated scope:** Medium

## T0-06: Establish test harnesses

**Description:** Configure Vitest, Testing Library, and Playwright with one meaningful
smoke test per layer before feature code exists.

**Acceptance criteria:**
- [x] Unit/component tests run in isolation with deterministic setup.
- [x] Playwright starts the application and verifies the root shell in a real browser.
- [x] Package scripts expose focused and full test commands used later by CI.

**Verification:**
- [x] `pnpm test` passes.
- [x] `pnpm test:e2e` passes.

**Dependencies:** T0-03

**Files likely touched:** `vitest.config.ts`, `src/test/setup.ts`,
`playwright.config.ts`, `tests/e2e/shell.spec.ts`, `package.json`

**Estimated scope:** Medium

## T0-07: Initialize Supabase Local

**Description:** Establish isolated local PostgreSQL, Auth, and Storage services
without defining P0 domain tables or production users.

**Acceptance criteria:**
- [x] Supabase Local starts reproducibly through the documented Docker workflow.
- [x] Local Auth and Storage are enabled with no production credentials or data.
- [x] Seed content contains configuration references only, never credentials.
- [x] The developer accepted responsibility for the local host firewall control:
  inbound TCP 54321/54322 is blocked by an enabled, enforced Windows Firewall rule
  across profiles; an external-device probe was not performed.

**Verification:**
- [x] `supabase start` succeeds and reports healthy local services.
- [x] `supabase db reset --local --network-id kgj-marketing-funnel-local` succeeds.
- [x] Manual checks confirm production endpoints are absent from local configuration.

**Progress note (2026-09-17):** Local config, empty seed, CLI-state ignore rules,
dedicated Docker network, and runbook are in place. A normal start and local reset
succeeded; PostgreSQL, Auth, Storage, and Kong were healthy, with zero application
tables, Auth users, and buckets. The reset must repeat `--network-id` to avoid a
split Docker network. On this Windows host, Docker still published ports 54321
and 54322 on all interfaces while Wi-Fi had a Public profile. The developer
verified the inbound block rule in `ActiveStore` with `EnforcementStatus` including
`Enforced`, and localhost TCP checks succeeded. No second-device probe was run;
the developer owns ongoing firewall safety and manually starts/stops Docker.

**Dependencies:** T0-02

**Files likely touched:** `supabase/config.toml`, `supabase/seed.sql`,
`supabase/.gitignore`, `docs/runbooks/local-development.md`

**Estimated scope:** Medium

## T0-08: Establish Drizzle connectivity and migration harness

**Description:** Connect the Node.js server to local PostgreSQL through Drizzle and
prove the migration workflow without implementing the Sprint 1 domain schema.

**Acceptance criteria:**
- [x] Drizzle configuration uses validated server-only environment values.
- [x] A reversible baseline migration and connectivity check run against Supabase Local.
- [x] The application database role is documented as least-privilege and separate from browser access.

**Verification:**
- [x] A clean local database applies the baseline migration successfully.
- [x] Database integration test proves connectivity and fails safely with invalid configuration.
- [x] `pnpm typecheck` and `pnpm test:integration` pass.

**Progress note (2026-09-17):** Pinned stable Drizzle ORM/Kit and Postgres.js;
added a server-only pooled connection, local-only migration guard, and a no-op
baseline with Drizzle journal metadata. `pnpm db:migrate:local` succeeded on the
empty local application schema; a fake non-local URL was rejected before connection.
Unit/component tests, integration tests, typecheck, lint, and a production build
with non-production fixture variables passed. Dedicated least-privilege application
role provisioning remains a prerequisite before staging; local smoke testing used
the local Supabase administrator connection only.

**Dependencies:** T0-05, T0-07

**Files likely touched:** `drizzle.config.ts`, `src/lib/db/client.ts`,
`src/lib/db/client.integration.test.ts`, `drizzle/0000_baseline.sql`, `package.json`

**Estimated scope:** Medium

## T0-09: Establish Supabase Auth and Storage client boundaries

**Description:** Create minimal server/browser adapters that enforce ADR-002 without
building login screens, admin routes, or media workflows.

**Acceptance criteria:**
- [x] Browser adapter exposes Auth session operations only.
- [x] Server adapter owns privileged Auth/Storage operations and never leaks secrets.
- [x] Boundary tests prove domain-table access is not exposed through browser modules.

**Verification:**
- [x] Unit tests pass for server/client import and configuration boundaries.
- [x] Local Auth session and Storage health smoke checks pass.
- [x] Client bundle inspection contains no server-only credential names or values.

**Progress note (2026-09-17):** Pinned official Supabase JS and SSR packages.
The browser adaptor exposes four Auth-session methods only; the server adaptor
uses cookie-backed `getUser()` for identity and a secret-key client limited to
Auth administration and Storage. Local Auth and Storage status endpoints returned
HTTP 200, and the no-session browser check returned null. No users, buckets,
domain tables, login UI, or media workflows were created. Admin profile checks
and the request proxy for token refresh remain with the later admin-auth feature.

**Dependencies:** T0-05, T0-07

**Files likely touched:** `src/lib/supabase/client.ts`,
`src/lib/supabase/server.ts`, `src/lib/supabase/boundary.test.ts`, `.env.example`

**Estimated scope:** Medium

## T0-10: Add CI quality gates

**Description:** Run the same accepted formatting, linting, type, test, integration,
browser smoke, and build checks on every pull request.

**Acceptance criteria:**
- [x] CI uses the pinned Node and pnpm versions with frozen-lockfile installation.
- [x] Supabase-dependent checks start isolated local services and clean them up.
- [ ] Any failed gate prevents merge to the protected production branch.

**Verification:**
- [ ] CI passes on the baseline branch.
- [ ] A controlled failing test proves the workflow reports and blocks the failing job.

**Progress note (2026-09-17):** A single `CI / quality` workflow and focused
formatting check are configured. Local formatting, lint, typecheck,
unit/component, integration, and build checks passed. The Chromium smoke
assertion passed, but the local Windows Playwright process did not exit after
teardown and was stopped manually. GitHub-hosted execution and protection of
`main` require the repository owner to publish the workflow and configure the
required status check. Do not mark T0-10 complete until a green run and a
controlled red-run merge block are observed.

**Dependencies:** T0-04, T0-06, T0-08, T0-09

**Files likely touched:** `.github/workflows/ci.yml`, `package.json`,
`docs/runbooks/ci.md`

**Estimated scope:** Medium

## T0-11: Validate Vercel preview with staging-only services

**Description:** Connect the repository to Vercel and prove a preview deployment
uses only staging Supabase and provider test configuration.

**Acceptance criteria:**
- [ ] Preview build passes through the accepted CI gate.
- [ ] Preview configuration contains no production database or provider credentials.
- [ ] Environment, migration promotion, rollback, secret ownership, and initial-admin
  responsibilities are recorded with named owners.

**Verification:**
- [ ] Preview URL renders the shell and passes Playwright smoke tests.
- [ ] Sanitized environment audit confirms staging-only endpoints.
- [ ] No production migration is invoked during Vercel build.

**Dependencies:** T0-10

**Files likely touched:** `.env.example`, `docs/runbooks/environment-and-deployment.md`,
`docs/runbooks/admin-bootstrap.md`, `README.md`

**Estimated scope:** Medium

## T0-12: Complete the Sprint 0 checkpoint

**Description:** Verify the foundation from a clean checkout and record readiness for
Sprint 1 without implementing Sprint 1 schema or features.

**Acceptance criteria:**
- [ ] Clean local setup, tests, build, Supabase reset, and preview smoke checks pass.
- [ ] Exact versions, owners, known limitations, and recovery procedures are documented.
- [ ] Human review explicitly approves or rejects entry into Sprint 1.

**Verification:**
- [ ] Run formatting, lint, typecheck, unit, integration, E2E smoke, and build once on the final state.
- [ ] Follow the local-development runbook from a clean checkout.
- [ ] Confirm no P0 feature, production secret, or production data was added in Sprint 0.

**Dependencies:** T0-11

**Files likely touched:** `README.md`, `docs/runbooks/local-development.md`,
`docs/runbooks/environment-and-deployment.md`, `tasks/todo.md`

**Estimated scope:** Small
