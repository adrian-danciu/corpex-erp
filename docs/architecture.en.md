# Architecture & Data Flow (English)

## Intended flow

1. Web app (`apps/web`) renders UI with React.
2. Web app calls the API via GraphQL (Apollo Client).
3. API (`apps/api`) handles GraphQL requests in NestJS (Apollo Server).
4. API reads/writes to Postgres using Prisma.

## Current backend state

- `apps/api/src/app.module.ts` only registers `AppController` and `AppService`.
- GraphQL and Prisma dependencies are present but not yet wired into modules.

## Frontend details

- UI primitives live in `apps/web/src/components/ui` (Radix + Tailwind). (shadcn as an ui library)
- Forms are built with React Hook Form + Zod.
- Global state is intended to be handled with Zustand.

## Backend details

- Postgres connectivity is configured via `DATABASE_URL` (see `apps/api/prisma.config.ts`).
- The Prisma schema defines `User` and `Role` in `apps/api/prisma/schema.prisma`.
- `apps/api/test-db.ts` is a quick sanity check for DB read/write.

## Ports and runtime

- API listens on `process.env.PORT` or `3000` (see `apps/api/src/main.ts`).
- Web dev server port is managed by Vite (default 5173 unless changed).
