# Kyma

A schema-driven internal IT operations platform — ticket tracking, asset/inventory tracking, and an admin dashboard, built to demonstrate real enterprise software patterns rather than a tutorial CRUD app.

The differentiator: statuses, categories, and (soon) custom fields are admin-configurable data, not hardcoded enums.

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

The seed script creates one admin account for local development:

```
admin@kyma.local / kyma-dev-admin
```

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

Milestone 1 (repo scaffold, schema, auth, CI) — in progress.
