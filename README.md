# Kyma

A schema-driven internal IT operations platform — ticket tracking, asset/inventory tracking, and an admin dashboard, built to demonstrate real enterprise software patterns rather than a tutorial CRUD app.

The differentiator: statuses, categories, and custom fields are admin-configurable data, not hardcoded enums.

## Stack

Next.js (App Router) · TypeScript · TailwindCSS + shadcn/ui · React Hook Form + Zod · TanStack Query · Prisma + PostgreSQL · Better Auth · Recharts · Vitest

## Getting started

```bash
pnpm install
cp .env.example .env   # already matches the docker-compose defaults below
docker compose up -d   # starts local Postgres
pnpm db:migrate         # applies the schema and seeds lookup data + an admin user
pnpm dev
```

The seed script creates three accounts for local development (all share one password):

```
admin@kyma.local / kyma-dev-password   (Admin)
priya@kyma.local / kyma-dev-password   (Staff)
sam@kyma.local   / kyma-dev-password   (Staff)
```

## Deploying

Not automated — needs a few one-time steps in Vercel/Supabase's own dashboards:

1. Create a [Supabase](https://supabase.com) project and copy its Postgres connection string.
2. Create a [Vercel](https://vercel.com) project from this GitHub repo.
3. In Vercel's project settings, add environment variables: `DATABASE_URL` (from step 1),
   `BETTER_AUTH_SECRET` (a fresh random value — don't reuse the local dev one), and
   `BETTER_AUTH_URL` (the production URL Vercel assigns, e.g. `https://kyma.vercel.app`).
4. Apply the schema to the Supabase database once, from a machine with `DATABASE_URL` pointed
   at it: `pnpm exec prisma migrate deploy`.
5. Deploy. Vercel builds and redeploys automatically on every push to `main`.

## Scripts

| Command                             | What it does                           |
| ----------------------------------- | -------------------------------------- |
| `pnpm dev`                          | Start the dev server                   |
| `pnpm build` / `pnpm start`         | Production build / run                 |
| `pnpm lint`                         | ESLint                                 |
| `pnpm format` / `pnpm format:check` | Prettier                               |
| `pnpm typecheck`                    | Next.js route typegen + `tsc --noEmit` |
| `pnpm test`                         | Vitest                                 |
| `pnpm db:migrate`                   | Apply Prisma migrations (and seed)     |
| `pnpm db:seed`                      | Re-run the seed script                 |
| `pnpm db:studio`                    | Prisma Studio                          |

## Status

Milestones 1–4 and 6–10 (scaffold, ticket CRUD, asset CRUD, admin dashboard, custom fields on
tickets and assets, custom entity tables, configurable dashboard widgets, in-app notifications,
audit log, ticket↔asset linking) done. Milestone 5 (deploy) is blocked on creating the
Vercel/Supabase projects by hand — see Deploying above. File attachments are deferred until
those accounts exist.
