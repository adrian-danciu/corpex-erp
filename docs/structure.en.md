# Project Structure (English)

## High-level layout
```
corpex-erp/
  apps/
    api/       # NestJS backend
    web/       # React frontend (Vite)
  docs/        # Project docs (EN + RO)
  package.json # Minimal root package (no scripts)
```

## apps/web (frontend)
- `src/`: React UI code.
- `src/components/ui/`: UI primitives (Radix + Tailwind + class-variance-authority).
- `public/`: static assets.
- `vite.config.ts`: Vite build config.

## apps/api (backend)
- `src/`: NestJS application (currently minimal `AppModule`).
- `prisma/schema.prisma`: Prisma schema (User + Role enums).
- `prisma.config.ts`: Prisma config with `DATABASE_URL`.
- `test-db.ts`: direct Prisma + Postgres connection test.
- `test-neon-direct.ts`: direct Neon connection test.

## How parts fit together (intended)
- `apps/web` uses Apollo Client + GraphQL to call the API.
- `apps/api` hosts a GraphQL endpoint (NestJS + Apollo Server).
- `apps/api` uses Prisma + Postgres to persist data.

Note: The backend code currently only wires `AppController` and `AppService`. GraphQL and Prisma are present as dependencies, but are not yet connected in `src/app.module.ts`.
