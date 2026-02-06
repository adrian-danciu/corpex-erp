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
   - `components/`: Shared components and UI primitives.
   - `pages/`: Page components organized by module (`hr`, `finance`).
   - `stores/`: Global state stores (Zustand).
   - `features/`: Feature-specific logic (not currently used, logic is in pages).
 - `src/components/ui/`: UI primitives (Radix + Tailwind + class-variance-authority).
 - `public/`: static assets.
 - `vite.config.ts`: Vite build config.

## apps/api (backend)
 - `src/`: NestJS application.
   - `auth/`: Authentication module.
   - `users/`: User management.
   - `employees/`: HR module (Employee management, leave requests).
   - `finance/`: Finance module (Partners, Invoices, Payments).
 - `src/schema.gql`: Auto-generated GraphQL schema.
 - `prisma/schema.prisma`: Prisma schema (User, Employee, Partner, Invoice, Payment, etc.).
- `prisma.config.ts`: Prisma config with `DATABASE_URL`.
- `test-db.ts`: direct Prisma + Postgres connection test.
- `test-neon-direct.ts`: direct Neon connection test.

## How parts fit together (intended)
- `apps/web` uses Apollo Client + GraphQL to call the API.
- `apps/api` hosts a GraphQL endpoint (NestJS + Apollo Server).
- `apps/api` uses Prisma + Postgres to persist data.

Note: The backend code wires `Auth`, `Users`, `Employees`, and `Finance` modules in `src/app.module.ts`. GraphQL and Prisma are connected.
