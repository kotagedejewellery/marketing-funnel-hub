# Local development: Supabase foundation

## Scope and prerequisites

T0-07 starts isolated PostgreSQL, Auth, and Storage services. It creates no P0
domain tables, buckets, Auth users, or production data. Use Docker Desktop and
Supabase CLI from the repository root. With Supabase CLI 2.58.5 and Docker Engine
29.7.2, a normal start and a clean local reset succeeded on 2026-09-16. The
database then had zero application tables, Auth users, and Storage buckets.
Host-network exposure is a separate safety gate described below.

On 2026-09-17, the developer confirmed a Windows Firewall inbound block rule for
TCP 54321 and 54322 was enabled, matched all profiles, and appeared as enforced
in `ActiveStore`; both loopback ports remained reachable. The developer owns this
host/firewall configuration. No second-device network probe was performed, so this
is an owner-accepted local-development control, not a claim of independently
measured network isolation. Keep the rule enabled and stop the stack when unused.

The local PostgreSQL major in `supabase/config.toml` is 17. Before staging or
production is provisioned, confirm the managed PostgreSQL major matches it.
Never link this local working directory to a production Supabase project.

## Start the local stack

1. Start Docker Desktop and verify `docker version` can reach the server.
2. Once per machine, create the dedicated Docker network. The option requests
   localhost binding, but **does not guarantee it** with every CLI/Docker Desktop
   combination. If the network already exists, skip this command:

   ```sh
   docker network create -o com.docker.network.bridge.host_binding_ipv4=127.0.0.1 kgj-marketing-funnel-local
   ```

3. From the repository root, start Supabase on that network:

   ```sh
   supabase start --network-id kgj-marketing-funnel-local
   supabase status
   ```

   The first start downloads Docker images. `supabase status` prints local
   connection values and development keys; treat them as local-only and never
   paste them into tracked files or logs. The API is on port 54321 and PostgreSQL
   is on port 54322 unless `supabase/config.toml` changes.

   Before using either service, inspect the actual host bindings:

   ```sh
   docker ps --filter name=kgj-marketing-funnel-hub --format "{{.Names}} {{.Ports}}"
   ```

   On the tested Windows Docker Desktop setup, both ports were published on
   `0.0.0.0` and `[::]` despite the network option. That is **not** proof of
   localhost-only access. Do not leave the stack running on an untrusted or
   Public network unless the environment owner has verified an effective host
   firewall restriction against non-local inbound connections. If that cannot
   be verified, run `supabase stop --network-id kgj-marketing-funnel-local`.

4. Create `.env.local` from `.env.example` for application development. Set
   `NEXT_PUBLIC_APP_ENV=local`, `NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000`,
   and use only the URL and publishable key from this local stack for public
   Supabase variables. Use the local database connection and server-only key
   only in their corresponding server-only variables. Do not copy production
   credentials, users, or data. The application integration is T0-08/T0-09;
   T0-07 itself does not require a populated `.env.local`.

## Rebuild and verify

`supabase db reset --local` **destroys and recreates only this local project's
database**, reapplies migrations, and runs `supabase/seed.sql`. Check that you are
in this repository and that `supabase/config.toml` has project ID
`kgj-marketing-funnel-hub` before running it. Never add `--linked` or `--db-url`.
Repeat the same `--network-id` on reset: otherwise this CLI version can place
the replacement database on a different Docker network from Auth and Storage.

```sh
supabase db reset --local --network-id kgj-marketing-funnel-local
supabase status
```

The expected T0-07 result is a healthy local PostgreSQL, Auth, and Storage stack
with no application tables, seeded users, or buckets. The seed file is
intentionally empty. Storage buckets and policies belong to Sprint 1; client
adapters and Auth/Storage smoke tests belong to T0-09.

Use `supabase stop --network-id kgj-marketing-funnel-local` when finished; the CLI
retains local data unless explicitly reset. If the start fails, check Docker
Desktop, free ports 54320-54322, and the CLI output before changing
configuration. Do not solve a local failure by pointing the application at
staging or production.

## Drizzle baseline and connectivity (T0-08)

Drizzle owns application schema migrations; Supabase CLI owns the local platform
services. The Sprint 0 baseline migration is a side-effect-free `SELECT 1` with an
empty schema snapshot. It creates no application tables or data and requires no
rollback DDL. Drizzle records its application in `drizzle.__drizzle_migrations`.

For repeatable local use, create an ignored `.env.local` from `.env.example` and
set both database variables using the **local** connection details on your own
machine. Never paste `supabase status` output into a ticket, chat, or tracked file.

- `DATABASE_MIGRATION_URL`: local Supabase administrator connection for the
  separately invoked migration CLI. `drizzle.config.ts` rejects anything other
  than `127.0.0.1:54322/postgres`; it cannot target staging or production.
- `DATABASE_URL`: server-only application connection. The T0-08 local smoke test
  may use the same local administrator URL temporarily because no application
  tables or dedicated role exist yet. Preview/production **must not** use that
  administrator role. Before staging, provision a distinct application login
  without `SUPERUSER`, `BYPASSRLS`, role/database creation, or schema ownership;
  grant only the table privileges and RLS policies required by its server domain
  modules. Keep migration credentials in the approved deployment job, not the
  Vercel application environment or browser.

After you manually start Supabase Local, run from the repository root:

```sh
pnpm db:migrate:local
pnpm test:integration
```

The integration script reads `.env.local` if present, while explicit process
environment variables take precedence (useful in CI). It validates the database
URL, opens a single prepared-statement-free Drizzle connection, executes a read-only
query, and closes the test connection. `pnpm test` remains the fast unit/component
suite; database tests run only through `pnpm test:integration`. Later schema changes
use `pnpm db:generate --name=<descriptive_name>` followed by SQL review and an
explicit local migration. Never run production migrations as part of `next build`.

## Auth and Storage boundaries (T0-09)

`src/lib/supabase/client.ts` exposes browser Auth session methods only, using the
publishable key. `src/lib/supabase/server.ts` validates a user through Supabase
Auth and keeps secret-key Auth administration and Storage access server-only. A
Supabase identity alone is **not** admin authorization: later admin routes must
also require an active `admin_profiles` row and the appropriate role.

The local smoke check is read-only and needs no user or bucket: `GET
/auth/v1/health` and `GET /storage/v1/status` on the local API both returned HTTP
200 on 2026-09-17. The browser adaptor also returned a null session when nobody
was signed in. No login screen, bucket policy, upload handler, or administrator
was created in T0-09. When admin login is implemented, add the request proxy for
cookie refresh and test an actual sign-in/authorization flow before relying on
server-side sessions.

Sources: [Supabase SSR client setup](https://supabase.com/docs/guides/auth/server-side/creating-a-client),
[API key boundaries](https://supabase.com/docs/guides/getting-started/api-keys),
and [Supabase Auth health endpoint](https://supabase.com/docs/guides/troubleshooting/how-do-i-check-gotrueapi-version-of-a-supabase-project-lQAnOR).

## Sources

- [Supabase CLI local setup](https://supabase.com/docs/guides/local-development/cli/getting-started)
- [Supabase CLI configuration](https://supabase.com/docs/guides/local-development/cli/config)
- [Local development workflow and reset semantics](https://supabase.com/docs/guides/local-development/cli-workflows)
- [Localhost-only Docker network guidance](https://supabase.com/docs/guides/local-development)
- [Supabase CLI custom-network reset issue](https://github.com/supabase/cli/issues/4644)
- [Supabase Drizzle connection guide](https://supabase.com/docs/guides/database/drizzle)
- [Supabase connection pooling and TLS](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Drizzle Kit migration journal](https://orm.drizzle.team/docs/drizzle-kit-migrate)
- [Next.js environment loading outside Next runtime](https://nextjs.org/docs/app/guides/environment-variables#loading-environment-variables-with-nextenv)
