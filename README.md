# KGJ Marketing Funnel Hub

An owned marketing conversion layer for Kotagede Jewellery. The P0 product will
publish a custom Link Bio, route product interest to the correct WhatsApp branch,
preserve campaign attribution, deliver Meta and GA4 signals, and retain canonical
first-party events.

## Current status

The repository contains the accepted P0 documentation, pinned application
toolchain, minimal Next.js App Router shell, Tailwind CSS v4/shadcn foundation, and
a validated public/server environment contract. Supabase Local, the Drizzle
connection/migration harness, and Auth/Storage client boundaries are ready; no application-domain tables exist yet.
Product, CMS, and tracking behavior have not been implemented. Unit, component,
database integration, and Chromium browser smoke tests are configured.

- T0-01 repository/Git baseline: complete (user-managed)
- T0-02 toolchain pinning: complete
- T0-03 minimal application shell: complete
- T0-04 Tailwind and shadcn/ui foundation: complete
- T0-05 environment contract: complete
- T0-06 test harnesses: complete
- T0-07 local Supabase: complete; Docker and host firewall are user-managed
- T0-08 Drizzle connectivity and baseline migration: complete
- T0-09 Supabase Auth/Storage client boundaries: complete
- T0-10 CI workflow: configured; GitHub run and branch protection await owner verification
- T0-11 onward: planned

## Quick start

Prerequisites:

- Node.js 24
- pnpm 11.15.1

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
# Fill every required value for the selected local/staging/production boundary.
pnpm dev
```

Open `http://localhost:3000`.

## Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Start the local development server |
| `pnpm build` | Create a production build |
| `pnpm start` | Serve the production build |
| `pnpm typecheck` | Run strict TypeScript checks |
| `pnpm lint` | Run ESLint |
| `pnpm format:check` | Check source/configuration formatting with Prettier |
| `pnpm test` | Run all unit and component tests once |
| `pnpm test:unit` | Run Node unit tests only |
| `pnpm test:component` | Run isolated jsdom component tests only |
| `pnpm test:watch` | Run Vitest in watch mode |
| `pnpm test:e2e` | Run Chromium shell smoke test on an isolated local server |
| `pnpm db:generate --name=<name>` | Generate reviewed Drizzle schema migration |
| `pnpm db:migrate:local` | Apply migrations to Supabase Local only |
| `pnpm test:integration` | Run database integration tests against local PostgreSQL |

Install the test browser once with `pnpm exec playwright install chromium` before
running `pnpm test:e2e`. The E2E runner starts its own server on port 3100 and
injects non-production fixture variables; it does not need `.env.local`, Supabase,
or live tracking credentials. On Windows, allow Playwright to terminate its local
server process tree when the test ends.

The Drizzle commands require an ignored `.env.local` with local `DATABASE_URL` and
`DATABASE_MIGRATION_URL`; the migration command rejects non-local database targets.
See the [local development runbook](docs/runbooks/local-development.md) for the
single-laptop workflow and database-role boundary.

## Documentation

Start with the [documentation index](docs/README.md). It defines source-of-truth
precedence and links to product, contracts, architecture, planning, and accepted
architecture decisions.

Implementation contributors must also follow [AGENTS.md](AGENTS.md).

## Architecture

P0 is a Next.js modular monolith hosted on Vercel, with Supabase PostgreSQL, Auth,
and Storage; Drizzle owns schema and migrations. Privileged database, auth,
storage, and tracking paths use the Node.js runtime.

See the [system architecture](docs/architecture/system-architecture.md) and
[accepted ADRs](docs/decisions/) for boundaries and rationale.
