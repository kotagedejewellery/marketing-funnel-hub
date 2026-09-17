# CI quality gate

The single `CI / quality` GitHub Actions job runs on every pull request and push
to `main`. It installs the pinned pnpm and Node 24 toolchain from the lockfile,
then runs formatting, lint, typecheck, unit/component tests, build, and the
Chromium shell smoke test. Finally it starts Supabase Local on its own ephemeral
GitHub-hosted runner, applies the reviewed Drizzle baseline, runs the database
integration test, and stops the local stack. It does not connect to staging or
production, and all values in the workflow are non-production fixtures or the
default credentials of that disposable local database.

No deployment, remote migration, provider call, or branch-protection setting is
performed by this workflow. The database and browser smoke checks are small on
purpose; later feature tests belong to the feature that introduces them.

## Repository owner verification

1. Manually publish the workflow to GitHub. Open **Actions → CI** and confirm
   `CI / quality` passes on `main` or a pull request. The local checks here do
   not substitute for an actual GitHub-hosted run.
2. In repository **Settings → Rules → Rulesets** (or Branch protection), target
   `main`, require a pull request and at least one approval, and require the
   `CI / quality` status check before merging. Disable force pushes.
3. On a disposable pull request, deliberately make one existing test fail.
   Confirm the CI job fails and GitHub blocks merge; restore the test and confirm
   the job turns green. This is a one-time gate check, not a new permanent test.
4. Keep Git and repository-setting operations owner-managed. Do not put real
   Supabase, Meta, Vercel, or production credentials into this CI job. The later
   staging/production deployment workflow requires separate approval and secrets.

For local parity, run `pnpm format:check`, `pnpm lint`, `pnpm typecheck`,
`pnpm test`, and `pnpm build`. Browser tests use `pnpm test:e2e`; database tests
require the owner-started Supabase Local stack, followed by
`pnpm db:migrate:local` and `pnpm test:integration`.

Sources: [pnpm setup action](https://github.com/pnpm/setup),
[Supabase CLI action](https://github.com/supabase/setup-cli),
[Prettier CI check](https://prettier.io/docs/cli#--check), and
[GitHub protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).
