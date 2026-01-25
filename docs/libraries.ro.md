# Librarii si Tooling (Romana)

Lista include librariile existente in repo. Unele nu sunt inca legate in codul runtime, dar sunt disponibile pentru folosire.

## Frontend (apps/web)
Librarii runtime:
- React + React DOM: randare UI.
- Apollo Client + GraphQL: stack de client GraphQL (intentie pentru API).
- Zustand: state global lightweight.
- React Hook Form + Zod + @hookform/resolvers: formulare + validare cu schema.
- Radix UI (Label, Slot): primitive accesibile folosite in componente.
- Lucide React: iconuri.
- clsx, class-variance-authority: compunere de clase si variante.
- tailwind-merge: rezolva conflicte de clase Tailwind.

Tooling / build:
- Vite: dev server + build.
- TypeScript: tipizare.
- Tailwind CSS + PostCSS + Autoprefixer + tw-animate-css: pipeline de styling.
- ESLint: linting cu pluginuri React hooks + refresh.

## Backend (apps/api)
Librarii runtime:
- NestJS: framework de aplicatie.
- @nestjs/graphql + @nestjs/apollo + @apollo/server + graphql: stack server GraphQL.
- Prisma + @prisma/adapter-pg + pg: ORM + driver Postgres.
- dotenv: incarca env vars.
- rxjs, reflect-metadata: dependinte interne NestJS.

Tooling / dev:
- Jest + ts-jest + supertest: teste unit si e2e.
- Prettier + ESLint: formatting si linting.
- Nest CLI + schematics: scaffolding.
- TypeScript + ts-node + tsconfig-paths: build/runtime support.

## Note
- Codul API nu inregistreaza inca modulele GraphQL sau Prisma in `src/app.module.ts`. Dependintele sunt prezente, wiring-ul e in asteptare.
