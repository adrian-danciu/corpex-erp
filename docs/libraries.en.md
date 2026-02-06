# Libraries & Tooling (English)

This list focuses on the libraries actually present in the repo. Some are not yet wired into the runtime code, but are available for use.

## Frontend (apps/web)
Runtime libraries:
- React + React DOM: UI rendering.
- Apollo Client + GraphQL: GraphQL client stack (intended for API calls).
- Zustand: lightweight global state store.
- React Hook Form + Zod + @hookform/resolvers: form handling + schema validation.
- Radix UI (Label, Slot): accessible primitives used by UI components.
- Lucide React: icon set.
- clsx, class-variance-authority: className composition and variants.
- tailwind-merge: resolves Tailwind class conflicts.

Tooling / build:
- Vite: dev server + build pipeline.
- TypeScript: type checking.
- Tailwind CSS + PostCSS + Autoprefixer + tw-animate-css: styling pipeline.
- ESLint: linting with React hooks + refresh plugins.

## Backend (apps/api)
Runtime libraries:
- NestJS: application framework.
- @nestjs/graphql + @nestjs/apollo + @apollo/server + graphql: GraphQL server stack.
- Prisma + @prisma/adapter-pg + pg: database ORM + Postgres driver.
- dotenv: loads environment variables.
- rxjs, reflect-metadata: NestJS internals.

Tooling / dev:
- Jest + ts-jest + supertest: unit and e2e testing.
- Prettier + ESLint: formatting and linting.
- Nest CLI + schematics: scaffolding.
- TypeScript + ts-node + tsconfig-paths: build/runtime support.

## Notes
- The API code registers GraphQL and Prisma modules in `src/app.module.ts`, along with feature modules (`Auth`, `Users`, `Employees`, `Finance`).
