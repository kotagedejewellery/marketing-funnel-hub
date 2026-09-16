# Sprint 0 Task Checklist

## Status

In progress — T0-02 and T0-03 completed by explicit authorization on 2026-09-15;
T0-01 remains user-managed and T0-04 onward remains planned.

## T0-01: Initialize repository and documentation baseline

**Description:** Initialize Git and make the normalized documentation the first
reviewable project baseline before generated application files are introduced.

**Acceptance criteria:**
- [ ] Git is initialized with an agreed default branch and safe `.gitignore`.
- [ ] Current source documents, accepted ADRs, and task plans are committed together.
- [ ] No application scaffold or secret is included in the baseline commit.

**Verification:**
- [ ] `git status --short` is clean after the baseline commit.
- [ ] `git log -1 --stat` contains documentation/planning files only.

**Current handoff:** Documentation relocation, root `README.md`, and reference
normalization are complete. Git initialization, `.gitignore`, `.editorconfig`, and
the baseline commit remain user-managed.

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

**Dependencies:** T0-01 remains user-managed; the user explicitly authorized an
execution-order exception for T0-02 and T0-03 on 2026-09-15.

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
- [ ] Tailwind processes the App Router source tree and exposes explicit base tokens.
- [ ] shadcn/ui configuration targets admin use and does not dictate public branding.
- [ ] No decorative design system or unused component collection is generated.

**Verification:**
- [ ] `pnpm build` passes with the styling pipeline enabled.
- [ ] One minimal style smoke assertion verifies generated styles load.

**Dependencies:** T0-03

**Files likely touched:** `src/app/globals.css`, `components.json`,
`src/lib/utils.ts`, `package.json`

**Estimated scope:** Small

## T0-05: Define and validate the environment contract

**Description:** Separate public and server-only configuration and fail safely when
required values are absent or malformed.

**Acceptance criteria:**
- [ ] Zod schemas distinguish local, staging, and production requirements.
- [ ] Public IDs are separated from database, Auth administration, Storage, CAPI,
  rate-limit, and scheduled-job secrets.
- [ ] `.env.example` documents every variable name and owner without values.

**Verification:**
- [ ] Unit tests cover valid configuration, missing required values, and public/server separation.
- [ ] A production build fails with a sanitized configuration error when required values are absent.

**Dependencies:** T0-03

**Files likely touched:** `.env.example`, `src/lib/env/server.ts`,
`src/lib/env/client.ts`, `src/lib/env/env.test.ts`

**Estimated scope:** Medium

## T0-06: Establish test harnesses

**Description:** Configure Vitest, Testing Library, and Playwright with one meaningful
smoke test per layer before feature code exists.

**Acceptance criteria:**
- [ ] Unit/component tests run in isolation with deterministic setup.
- [ ] Playwright starts the application and verifies the root shell in a real browser.
- [ ] Package scripts expose focused and full test commands used later by CI.

**Verification:**
- [ ] `pnpm test` passes.
- [ ] `pnpm test:e2e` passes.

**Dependencies:** T0-03

**Files likely touched:** `vitest.config.ts`, `src/test/setup.ts`,
`playwright.config.ts`, `tests/e2e/shell.spec.ts`, `package.json`

**Estimated scope:** Medium

## T0-07: Initialize Supabase Local

**Description:** Establish isolated local PostgreSQL, Auth, and Storage services
without defining P0 domain tables or production users.

**Acceptance criteria:**
- [ ] Supabase Local starts reproducibly through the documented Docker workflow.
- [ ] Local Auth and Storage are enabled with no production credentials or data.
- [ ] Seed content contains configuration references only, never credentials.

**Verification:**
- [ ] `supabase start` succeeds and reports healthy local services.
- [ ] `supabase db reset` succeeds from a clean local state.
- [ ] Manual checks confirm production endpoints are absent from local configuration.

**Dependencies:** T0-02

**Files likely touched:** `supabase/config.toml`, `supabase/seed.sql`,
`supabase/.gitignore`, `docs/runbooks/local-development.md`

**Estimated scope:** Medium

## T0-08: Establish Drizzle connectivity and migration harness

**Description:** Connect the Node.js server to local PostgreSQL through Drizzle and
prove the migration workflow without implementing the Sprint 1 domain schema.

**Acceptance criteria:**
- [ ] Drizzle configuration uses validated server-only environment values.
- [ ] A reversible baseline migration and connectivity check run against Supabase Local.
- [ ] The application database role is documented as least-privilege and separate from browser access.

**Verification:**
- [ ] A clean local database applies the baseline migration successfully.
- [ ] Database integration test proves connectivity and fails safely with invalid configuration.
- [ ] `pnpm typecheck` and `pnpm test:integration` pass.

**Dependencies:** T0-05, T0-07

**Files likely touched:** `drizzle.config.ts`, `src/lib/db/client.ts`,
`src/lib/db/client.integration.test.ts`, `drizzle/0000_baseline.sql`, `package.json`

**Estimated scope:** Medium

## T0-09: Establish Supabase Auth and Storage client boundaries

**Description:** Create minimal server/browser adapters that enforce ADR-002 without
building login screens, admin routes, or media workflows.

**Acceptance criteria:**
- [ ] Browser adapter exposes Auth session operations only.
- [ ] Server adapter owns privileged Auth/Storage operations and never leaks secrets.
- [ ] Boundary tests prove domain-table access is not exposed through browser modules.

**Verification:**
- [ ] Unit tests pass for server/client import and configuration boundaries.
- [ ] Local Auth session and Storage health smoke checks pass.
- [ ] Client bundle inspection contains no server-only credential names or values.

**Dependencies:** T0-05, T0-07

**Files likely touched:** `src/lib/supabase/client.ts`,
`src/lib/supabase/server.ts`, `src/lib/supabase/boundary.test.ts`, `.env.example`

**Estimated scope:** Medium

## T0-10: Add CI quality gates

**Description:** Run the same accepted formatting, linting, type, test, integration,
browser smoke, and build checks on every pull request.

**Acceptance criteria:**
- [ ] CI uses the pinned Node and pnpm versions with frozen-lockfile installation.
- [ ] Supabase-dependent checks start isolated local services and clean them up.
- [ ] Any failed gate prevents merge to the protected production branch.

**Verification:**
- [ ] CI passes on the baseline branch.
- [ ] A controlled failing test proves the workflow reports and blocks the failing job.

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
