# KGJ Marketing Funnel Hub

An owned marketing conversion layer for Kotagede Jewellery. The P0 product will
publish a custom Link Bio, route product interest to the correct WhatsApp branch,
preserve campaign attribution, deliver Meta and GA4 signals, and retain canonical
first-party events.

## Current status

The repository contains the accepted P0 documentation, pinned application
toolchain, and a minimal Next.js App Router shell. Product, CMS, database-domain,
and tracking behavior have not been implemented yet.

- T0-01 repository/Git baseline: user-managed
- T0-02 toolchain pinning: complete
- T0-03 minimal application shell: complete
- T0-04 onward: planned, pending explicit authorization

## Quick start

Prerequisites:

- Node.js 24
- pnpm 11.15.1

```bash
pnpm install --frozen-lockfile
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

Automated test commands will be added under T0-06.

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
