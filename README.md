# KGJ Marketing Funnel Hub

An owned marketing conversion layer for Kotagede Jewellery. The P0 product will
publish a custom Link Bio, route product interest to the correct WhatsApp branch,
preserve campaign attribution, deliver Meta signals, and retain canonical
first-party events.

## Current status

The repository contains the P0 application and its three consolidated source-of-truth
documents. Supabase Local has the ten approved application tables, RLS/grants,
settings/section seed, and two Storage buckets. See `tasks/` for implementation
status; the summary below records the earlier foundation milestones only.

- T0-01 repository/Git baseline: complete (user-managed)
- T0-02 toolchain pinning: complete
- T0-03 minimal application shell: complete
- T0-04 Tailwind and shadcn/ui foundation: complete
- T0-05 environment contract: complete
- T0-06 test harnesses: complete
- T0-07 local Supabase: complete; Docker and host firewall are user-managed
- T0-08 Drizzle connectivity and baseline migration: complete
- T0-09 Supabase Auth/Storage client boundaries: complete
- T0-10 CI quality gates: complete (GitHub verification owner-reported)
- T0-11 Vercel Preview/staging gate: retired by the approved local/live decision
- T0-12 Sprint 0 checkpoint: in progress; see the checklist for remaining owner actions
- Sprint 1 database schema: applied and verified locally; live migration was
  reported successful by the owner but has not been independently checked here
- Public Link Bio and desktop-oriented responsive CMS: implemented locally; owner review remains
- P0 application implementation: complete locally. The public funnel
  (product → branch → WhatsApp, `PageView`/`ViewContent`/`Contact`) passed one
  focused browser check on 21 September 2026 under the earlier consent flow;
  the current automatic-tracking policy remains unverified. `pnpm typecheck`
  passed before this policy change.
- Production deployment, provider activation, WAF, retention scheduling, and
  live verification remain owner-managed and have not been verified here.

## Quick start

Prerequisites:

- Node.js 24
- pnpm 11.15.1

```bash
pnpm install --frozen-lockfile
# If .env.local does not exist, copy .env.example to it and fill local values.
# Do not overwrite an existing .env.local or use live credentials here.
pnpm dev
```

Open `http://localhost:3000` for the branch directory. Each active branch has
its own Link Bio at `http://localhost:3000/{branch-slug}`; old `/b/{branch-slug}`
links redirect to the direct URL. The CMS manages branch pages at
`/admin/link-bio` and shared defaults at `/admin/settings`.

## Commands

| Command                          | Purpose                                                 |
| -------------------------------- | ------------------------------------------------------- |
| `pnpm dev`                       | Start the local development server                      |
| `pnpm build`                     | Create a production build                               |
| `pnpm start`                     | Serve the production build                              |
| `pnpm typecheck`                 | Run strict TypeScript checks                            |
| `pnpm lint`                      | Run ESLint                                              |
| `pnpm format:check`              | Check source/configuration formatting with Prettier     |
| `pnpm quality:check`             | Run the same fast quality gate as CI before pushing     |
| `pnpm test`                      | Run all unit and component tests once                   |
| `pnpm test:unit`                 | Run Node unit tests only                                |
| `pnpm test:component`            | Run isolated jsdom component tests only                 |
| `pnpm test:watch`                | Run Vitest in watch mode                                |
| `pnpm test:e2e`                  | Run Chromium public-page smoke against Supabase Local   |
| `pnpm db:generate --name=<name>` | Generate reviewed Drizzle schema migration              |
| `pnpm db:migrate:local`          | Apply migrations to Supabase Local only                 |
| `pnpm db:migrate:live`           | Apply reviewed migrations to hosted Supabase explicitly |
| `pnpm test:integration`          | Run database integration tests against local PostgreSQL |

Install the test browser once with `pnpm exec playwright install chromium` before
running `pnpm test:e2e`. Start Supabase Local and apply Drizzle migrations first.
The E2E runner starts its own server on port 3100, uses `.env.local` when present,
and never needs live tracking credentials. On Windows, allow Playwright to
terminate its local server process tree when the test ends.

Browser smoke tests use only the local database, never the live database.

Before pushing code or deploying, run `pnpm quality:check`. It runs formatting,
lint, TypeScript, unit/component tests, and the production build in the same
order as the fast GitHub CI gate. Database integration and browser E2E checks
remain in CI because they require Supabase Local and Playwright.

The Drizzle commands require an ignored `.env.local` with local `DATABASE_URL` and
`DATABASE_MIGRATION_URL`; the migration command rejects non-local database targets.
For a fresh local database, start Docker Desktop, run
`supabase start --network-id kgj-marketing-funnel-local`, then
`pnpm db:migrate:local`. A `supabase db reset --local` must be followed by the
separate Drizzle migration. Keep local Supabase ports protected from non-local
traffic and stop the stack when unused; never use live credentials for local work.
The database-role and deployment boundaries are in the
[system architecture](docs/system-architecture.md).

For the first hosted Supabase migration, copy `.env.live.example` to the ignored
`.env.live.local`, then paste the **Direct connection** URI from Supabase Dashboard
`Connect`, or use the **Session pooler** URI on port `5432` when the local network
cannot reach the IPv6 direct endpoint. Use the `postgres` role, percent-encode
reserved password characters, and run `pnpm db:migrate:live` manually. The live
configuration rejects localhost, non-Supabase hosts, transaction-pooler port
`6543`, non-admin usernames, and SSL modes other than `require`. Never place the
live migration URI in Vercel or reuse it as the application's `DATABASE_URL`.

## Documentation

The complete `/docs` set is [PRD](docs/prd.md),
[System Architecture](docs/system-architecture.md), and
[Database Design](docs/database-design.md). The brief PDF supplied by the owner
is business source material; these three documents include the later approved
project-specific technical decisions.

Implementation contributors must also follow [AGENTS.md](AGENTS.md).

## Architecture

P0 is a Next.js modular monolith hosted on Vercel, with Supabase PostgreSQL, Auth,
and Storage; Drizzle owns schema and migrations. Privileged database, auth,
storage, and tracking paths use the Node.js runtime.

See the [system architecture](docs/system-architecture.md) for runtime, security,
tracking, and the two-environment (local/live) decision.
