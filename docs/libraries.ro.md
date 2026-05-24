# Librarii si Tooling (Romana)

Lista include librariile existente in repo si locurile principale unde sunt folosite.

## Frontend (apps/web)
Librarii runtime:
- React + React DOM: randare UI.
- Apollo Client + GraphQL: client GraphQL pentru API-ul NestJS.
- React Router DOM: routing protejat in aplicatie.
- Zustand: state global lightweight (`auth.store.ts` cu persistenta in localStorage).
- React Hook Form + Zod + @hookform/resolvers: formulare + validare cu schema.
- Radix UI / shadcn primitives: dialog, sheet, select, tabs, separator, checkbox, label si alte blocuri UI.
- Lucide React: iconuri.
- Sonner: notificari toast, folosit prin helpere locale.
- Recharts: grafice pentru dashboard/rapoarte.
- react-d3-tree: organigrama HR.
- @react-pdf/renderer + xlsx: exporturi pentru facturi/rapoarte/payroll.
- @dnd-kit/react + @dnd-kit/helpers: drag-and-drop pentru kanban-ul task-urilor de proiect.
- date-fns: formatare date in HR si ecrane conexe.
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
- @nestjs/config: configurare env.
- @nestjs/jwt + @nestjs/passport + passport-jwt: autentificare JWT.
- @nestjs/schedule: joburi programate pentru expirari/notificari.
- @nestjs/platform-express + multer (`@types/multer`): upload de fisiere (atasamentele din feed-ul de proiect prin `POST /uploads/project-feed`).
- graphql-type-json: scalar JSON folosit de `ProjectFeedEntry.metadata`.
- Prisma + @prisma/adapter-pg + pg: ORM + driver Postgres.
- bcrypt: hash parole.
- class-validator: suport de validare DTO unde sunt folosite decoratoare.
- dotenv: incarca env vars.
- rxjs, reflect-metadata: dependinte interne NestJS.

Tooling / dev:
- Jest + ts-jest + supertest: teste unit si e2e.
- Prettier + ESLint: formatting si linting.
- Nest CLI + schematics: scaffolding.
- TypeScript + ts-node + tsconfig-paths: build/runtime support.

## Note
- Codul API inregistreaza modulele GraphQL si Prisma in `src/app.module.ts`, impreuna cu modulele de functionalitate (`Auth`, `Users`, `Employees`, `Finance`, `Stock`, `Fleet`, `Projects`, `Notifications`, `Reporting`, `Settings`, `Payroll`).
- Foloseste Bun pentru dependinte si scripturi. Nu introduce lockfile-uri npm/yarn.
