# Project Task Checklist

## Status

In progress — T0-01 through T0-10 are complete; T0-10 GitHub verification was
reported by the repository owner. T0-11 was retired by the local/live decision in
`docs/system-architecture.md`; T0-12 is in progress.
Git and host firewall operations remain user-managed. The owner separately
authorized local Docker/database work for Sprint 1.

The five-part frontend plan below is a historical implementation checklist;
its unchecked entries do not by themselves prove missing code. P0 application
implementation is complete locally. Sprint 0 checkpoint T0-12 and live release
operations remain owner-managed.

## P0 implementation closeout (21 September 2026)

- [x] Public Link Bio, CMS, product–branch WhatsApp, consent/canonical-event
      tracking, admin-profile management, and retention endpoint are present in
      code (inspection, not a claim of live verification).
- [x] P0 schema applied locally; the owner reported successful live migration.
- [x] Verify one local active product → branch → WhatsApp journey with consented
      `PageView`, `ViewContent`, and `Contact`, including the correct destination.
      One focused browser flow passed on 21 September 2026.
- [x] Close the agent-owned P0 application implementation after the local flow
      check, as directed by the owner. This does not claim a verified live release.

## Live release (owner-managed; outside this P0 implementation closeout)

- [ ] Resolve the Vercel Hobby/private-repository deployment block.
- [ ] Approve live domain, product/branch content, consent/privacy copy, and
      Meta/GTM/GA4 configuration.
- [ ] Confirm live Auth/Storage, environment variables, WAF rate limit, and
      retention schedule before production activation.
- [ ] Deploy and perform one focused live funnel smoke check.

## T0-01: Initialize repository and documentation baseline

**Description:** Initialize Git and make the normalized documentation the first
reviewable project baseline before generated application files are introduced.

**Acceptance criteria:**

- [x] Git is initialized with an agreed default branch and safe `.gitignore`.
- [x] Current source documents and task plans are owner-managed in Git.
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

**Description:** Select current stable versions compatible with Vercel and the system architecture,
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

- [x] Zod schemas distinguish local and production requirements.
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
`supabase/.gitignore`, `docs/system-architecture.md`

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
role provisioning remains a prerequisite before live deployment; local smoke testing used
the local Supabase administrator connection only.

**Dependencies:** T0-05, T0-07

**Files likely touched:** `drizzle.config.ts`, `src/lib/db/client.ts`,
`src/lib/db/client.integration.test.ts`, `drizzle/0000_baseline.sql`, `package.json`

**Estimated scope:** Medium

## T0-09: Establish Supabase Auth and Storage client boundaries

**Description:** Create minimal server/browser adapters that enforce the system-architecture access boundary without
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
- [x] Any failed gate prevents merge to the protected production branch (owner-reported).

**Verification:**

- [x] CI passes on the baseline branch (owner-reported).
- [x] A controlled failing test proves the workflow reports and blocks the failing job (owner-reported).

**Progress note (2026-09-17):** A single `CI / quality` workflow and focused
formatting check are configured. Local formatting, lint, typecheck,
unit/component, integration, and build checks passed. The Chromium smoke
assertion passed, but the local Windows Playwright process did not exit after
teardown and was stopped manually. GitHub-hosted execution and protection of
`main` require the repository owner to publish the workflow and configure the
required status check. Do not mark T0-10 complete until a green run and a
controlled red-run merge block are observed. The owner reported both checks
successful on 2026-09-17; no GitHub evidence was independently accessed here.

**Dependencies:** T0-04, T0-06, T0-08, T0-09

**Files likely touched:** `.github/workflows/ci.yml`, `package.json`,
`docs/system-architecture.md`

**Estimated scope:** Medium

## T0-11: Retired Preview/staging gate

Removed from Sprint 0 by the [local/live decision](../docs/system-architecture.md)
at the owner's request. No staging Supabase project or Vercel Preview validation
is required. Its repository-only preparation is simplified to local/live guidance.

## T0-12: Complete the Sprint 0 checkpoint

**Description:** Verify the foundation from a clean checkout and record readiness for
Sprint 1 without implementing Sprint 1 schema or features.

**Acceptance criteria:**

- [ ] Clean local setup, tests, build, Supabase reset, and local browser smoke pass.
- [x] Exact versions, owners, known limitations, and recovery procedures are documented.
- [x] Owner authorized the local Sprint 1 P0 database work on 2026-09-17;
      this does not authorize a live deployment.

**Verification:**

- [x] Format, lint, typecheck, unit/component (10 tests), database integration
      (4 read-only tests), and production build with local CI fixtures passed on
      2026-09-17. No live credentials were used. The build predates the P0 schema;
      the format, lint, typecheck, and tests were rerun afterward.
- [ ] Local browser smoke exits cleanly. Its single assertion passed, but the
      Playwright process hung during Windows shutdown and was interrupted.
- [x] The baseline and P0 schema migrations replayed successfully after a local
      Supabase reset on 2026-09-17. The earlier `uv_os_get_passwd returned ENOMEM`
      was specific to restricted execution; no live database was used.
- [x] Owner authorized local Docker access. A local reset followed by
      `pnpm db:migrate:local` and `pnpm test:integration` passed. Git remains
      owner-managed; clean-checkout/browser-shutdown verification is still open.
- [x] No P0 product feature, production secret, or production data was added in
      Sprint 0. The P0 schema was added afterward with owner authorization.

**Recovery:** Follow the [local development guidance](../README.md#quick-start)
for the local reset and separate Drizzle migration. A passing browser assertion
does not count as a clean E2E command exit; rerun the one-test smoke after the
machine is stable. The owner handles Git and any eventual live deployment.

**Dependencies:** T0-10

**Files likely touched:** `README.md`, `docs/system-architecture.md`, `tasks/todo.md`

**Estimated scope:** Small

---

## Frontend P0 — five-part delivery plan

**Status:** Implementation in progress; FE-01 awaits owner manual review.
**Scope:** Public Link Bio and Admin CMS in the existing Next.js application.
These are frontend work packages, not five separate applications. Each numbered
part should be delivered in the small sub-slices listed below, with its required
server contract ready before connecting forms or tracking. Do not create mock
business records in the database, new APIs, or new dependencies just to complete
a screen. Use existing Next.js/React/Tailwind patterns and shadcn/ui only where
it helps the Admin UI. Prefer Server Components and native browser controls.

**Verification rule for all five parts:** Before running tests or browser
automation, propose the exact checks and obtain the owner's confirmation.
Keep all checks proportionate; small edits need not trigger a full suite.
Mark a feature verified only after the agreed checks actually run, and record
deferred checks honestly. Do not access Supabase live for ordinary local work.

**Current implementation status:** FE-01 Storage image integration, image-error
fallback, and mobile branch CTA layout are coded; the owner's manual review of
normal/empty/broken-image states is pending. FE-02
login/protected shell/dashboard are coded. Earlier FE-01 TypeScript, lint,
focused unit/component checks, and the local mobile empty-state browser case
passed before this image-error/CTA polish; no checks were rerun for these edits.
Normal and broken-image cases await real media. FE-02 login/role behavior awaits an
approved local admin account. FE-03 settings, sections, campaign/link forms,
pagination, and media upload are coded. TypeScript, lint, and four focused
campaign-WIB/URL/image-signature tests passed on 2026-09-18; a local admin
walkthrough remains pending account availability. FE-04 product, branch, and
product-centric assignment editors are coded. TypeScript, lint, and six focused
slug/WhatsApp/fallback tests passed on 2026-09-18; the local assignment-to-public
walkthrough remains pending account availability and separate approval. FE-05
has a read-only Admin event list coded; TypeScript and lint passed on 2026-09-18.
A first-party consent control is coded with draft copy, separate opt-in choices,
and a 30-day cookie; its one focused unit test, TypeScript, and lint passed on
2026-09-18. The production policy/copy approval remains pending. A shared
discriminated schema for the three canonical events is coded but not yet
verified. The browser PageView/ViewContent/Contact adapter and consent-change
hook are coded. The local-only backend now supplies an anonymous journey and
signed UTM context and accepts consented canonical events at `/api/events` with
active-context validation and idempotent internal storage. These changes are
implemented and the local PageView UTM/consent/idempotent-retry path, public
mobile/desktop overflow baseline, and unauthenticated Admin protection passed
Playwright on 2026-09-19; TypeScript and lint also passed. Product-scoped
ViewContent/Contact still need active local product/branch data, and authenticated
CMS pages still need a local admin account. Meta CAPI, provider scripts,
deployment-edge rate limiting, and production activation remain open. No frontend
package is marked complete.

### FE-01 — Complete the public Link Bio (Sprint 2; implemented, review pending)

**Existing baseline:** `src/app/page.tsx`, `src/components/public/link-bio.tsx`,
and `src/modules/public-content/data.ts` already render database-backed,
active-only text content, one campaign, expandable product context, direct
product/branch WhatsApp anchors, secondary/social links, and empty states. Keep
those behaviors; do not rebuild the page from scratch.

**Sub-slices / components:**

- [x] Retain server-rendered public content and current direct WhatsApp anchors.
- [x] Present brand header, eligible campaign, product cards/context, branch
      CTA list, secondary/social links, and footer as readable mobile-first
      sections. Extract components such as `BrandHeader`, `CampaignBanner`,
      `ProductCard`, and `BranchWhatsAppLinks` only when reuse/clarity warrants it.
- [x] Show logo, campaign banner, and product image from validated Supabase
      Storage references with appropriate alt text, sizing, and text fallback.
      A broken/missing image must not remove product information or a valid CTA.
- [x] Keep a single-page product interaction; the existing native expandable
      section is sufficient unless actual usability evidence requires a sheet.
      No mandatory product/branch modal, form, or interstitial before WhatsApp.
- [ ] Check small-screen/Instagram in-app browser layout, keyboard/focus order,
      tap targets, inactive-content hiding, and product-without-active-branch
      messaging without introducing a separate desktop design.

**Validation and dependency:** No public form or new Zod schema is needed here.
The server-owned public DTO must add validated image URLs/paths and continue to
filter unsafe links and inactive records. Requires approved brand/media content
and public-read Storage assets; absence of those assets uses a text fallback.

**Acceptance:** Visitor can identify KGJ, find an active product, expand its
context, and open the correct branch WhatsApp link on mobile. At most one
campaign appears; no broken image or invalid CTA blocks the journey.

**Verification to propose at feature completion:** One focused local mobile
browser walkthrough covering normal/empty/broken-image states and a valid
WhatsApp destination, plus only the relevant existing checks if approved.

### FE-02 — Admin sign-in, protected shell, and compact dashboard (Sprint 3)

**Sub-slices / components:**

- [ ] Add a login page with a labeled `LoginForm`, pending/error states, and
      sign-out action using Supabase Auth. No public registration UI or custom
      account-management flow in P0.
- [ ] Add a protected Admin layout with simple navigation to Dashboard,
      Content, Campaigns, Products, Branches, Links, Settings, and Tracking
      Validation. Keep the current-page label and keyboard focus visible.
- [ ] Make missing/expired sessions return to login and missing/inactive
      `admin_profiles` show a safe access-denied state. Never expose provider
      credentials in page props or UI.
- [ ] Add a small dashboard summary: public page status, eligible campaign,
      active product/branch counts, and recent sanitized changes. Do not add
      charts or an enterprise analytics dashboard.

**Forms / Zod:** Login input validates email format and non-empty password for
usable feedback; the server remains authoritative for authentication. Do not
invent extra password policy or duplicate the admin role model in client state.
No modal is required for login, navigation, or dashboard.

**Backend prerequisite:** Server-validated Supabase session, active profile and
`admin`/`technical_admin` capability checks, and a limited dashboard read model.
Admin provisioning remains owner-controlled per the bootstrap runbook.

**Acceptance:** Unauthenticated/inactive users cannot see Admin content;
authorized admins can sign in, navigate, see concise status, and sign out.

**Verification to propose at feature completion:** Focused local login,
unauthorized, and navigation checks using owner-approved local admin data.

### FE-03 — CMS for brand content, sections, campaigns, links, and media (Sprint 3)

**Sub-slices / components:**

- [ ] Build `SiteSettingsForm` for site name, headline, introduction, logo,
      privacy URL, default WhatsApp message, and default CTA label. Keep social
      destinations in Links, not duplicate fields in settings.
- [ ] Build a `SectionList` with active/inactive controls and simple move
      up/down ordering; show a public-page preview/link where useful. Do not add
      drag-and-drop solely for ordering.
- [ ] Build paginated `CampaignList` and `CampaignForm` for name, title, copy,
      banner, target URL, active period, status, and order. Show a warning for
      overlapping active periods, not a hard rejection; public selection still
      displays at most one campaign.
- [ ] Build paginated `LinkList` and `LinkForm` for secondary/social type,
      label, safe destination URL (HTTPS in production; localhost HTTP only
      when explicitly allowed locally), platform/icon when relevant, status,
      and order.
- [ ] Add a reusable inline image-upload field and preview for brand,
      campaign, and later product forms. Show upload progress/errors and use
      returned Storage paths, not arbitrary privileged browser writes.
- [ ] Show field-level errors, save/pending/success states, and confirmation
      only when an action would discard unsaved edits. Routine removal uses
      deactivate rather than delete; no generic modal framework is required.

**Forms / Zod:** Shared server-side schemas for settings, campaign (including
end-after-start), links (safe URL/type), section ordering/status, and media
metadata; client-side feedback may reuse those schemas where practical.
Validate uploaded file type/size/path on the server as well as in the UI.

**Backend prerequisite:** Authorized Server Actions or admin endpoints for the
listed mutations, Storage upload boundary, audit logs, paginated reads, and
public cache invalidation. The UI must consume those contracts rather than
querying domain tables directly from the browser.

**Acceptance:** Marketing can change routine brand content, campaign, section
visibility/order, and links locally without code deployment; public output
reflects successful changes and validation errors are actionable.

**Verification to propose at feature completion:** One local save-to-public
walkthrough for settings, campaign, and link, plus focused validation/role checks.

### FE-04 — CMS for products, branches, assignments, and WhatsApp (Sprints 3–4)

**Sub-slices / components:**

- [ ] Build paginated `ProductList` and `ProductForm` for name, canonical slug,
      description, image, active status, and simple order controls. A product is
      a customer-facing need/category, not an inventory SKU.
- [ ] Build paginated `BranchList` and `BranchForm` for name, slug, normalized
      WhatsApp number, optional CTA label, status, and order.
- [ ] Add a product-centric `BranchAssignmentEditor`: branch checkboxes/list,
      active state, order, optional assignment CTA label and message override.
      Do not create a matrix UI or a separate branch-selector page for P0.
- [ ] Show the resolved CTA label/message fallback and a read-only WhatsApp
      destination preview inside the editor; the server still generates the
      final URL. Warn when an active product has no active assigned branch.
- [ ] After a save/activate/deactivate, show actionable field or conflict
      errors and confirm the public product context reflects the change. Do
      not add destructive delete controls for routine Marketing actions.

**Forms / Zod:** Server-authoritative schemas cover product name/slug,
branch country-code digits, assignment UUID pair/uniqueness, active state/order,
and the supported `{product}`/`{branch}` message variables. Reuse schemas for
client feedback; never trust a browser-composed WhatsApp URL as authoritative.
Use inline editors, not a modal for every assignment.

**Backend prerequisite:** Authenticated product/branch/assignment mutations,
active-state filtering, WhatsApp fallback/URL resolution, audit logs, and public
cache invalidation. Reuse the existing public CTA path rather than replacing it.

**Acceptance:** One product can be assigned to multiple branches; each active
assignment yields the correct branch-specific `wa.me` link and prefilled
message. Inactive links are hidden, and tracking cannot delay navigation.

**Verification to propose at feature completion:** One local product → branch
assignment → public WhatsApp walkthrough, including an inactive branch and a
message-template fallback, if approved.

### FE-05 — Consent, browser events, and Admin tracking validation (Sprints 5–7)

**Sub-slices / components:**

- [ ] Add a small accessible `ConsentControl` with a first-party saved choice
      and a way to reopen preferences. A compact preferences dialog is allowed
      only for changing consent; it must never be a required WhatsApp step.
      Keep Meta, GTM/GA4, and internal anonymous events disabled until the
      applicable consent state permits them.
- [ ] Add one focused client tracking adapter for `PageView` on page entry,
      `ViewContent` when product context is opened, and `Contact` on a product-
      scoped branch WhatsApp click. Branch choice alone emits no extra
      `ViewContent`; do not invent other P0 event names.
- [ ] Build each canonical event once with one UUID `eventId` and the active
      attribution/session context; pass the same ID to Meta Pixel and the
      server event request. GTM owns GA4 dispatch; no direct duplicate `gtag`
      path. Browser code must not read signed attribution cookies as its own
      source of truth.
- [ ] On Contact, push only consent-allowed browser events and issue a
      best-effort `keepalive` request to `/api/events`. Keep the existing normal
      WhatsApp anchor; never `preventDefault`, await tracking, or add an
      interstitial. Failures stay invisible to the visitor.
- [ ] Add a paginated, read-only `TrackingValidationList` in Admin with recent
      canonical event name/time, product, branch, and source/campaign. It must
      not claim Meta/GA4 delivery status from an internal event row. No charts,
      conversion dashboard, or export workflow in P0.

**Validation / policy:** Reuse the canonical discriminated event schema/type
(`PageView`, `ViewContent`, `Contact`) and validate at `/api/events`; do not
duplicate independent provider-specific schemas in components. Consent text,
default behavior, and production activation require owner/business approval.
No lead/contact PII is collected.

**Backend prerequisite:** Anonymous session and signed UTM attribution,
consent-aware `/api/events`, idempotent event storage, internal Meta CAPI module,
and authorized read-only event listing. Provider configuration remains outside
the CMS. This plan does not authorize live provider activation.

**Acceptance:** With consent, the three canonical events share their correct
context across allowed destinations; without consent, disallowed destinations
stay off. WhatsApp opens even when JavaScript or analytics fails, and Admin
shows only canonical internal events.

**Verification to propose at feature completion:** One local paid-style UTM
journey covering consent allowed/denied, event IDs, product/branch context, and
WhatsApp with blocked tracking; review the narrow provider checks separately
before any live activation.
