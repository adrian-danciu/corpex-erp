# Libraries & Tooling (English)

This list focuses on the libraries actually present in the repo and the places where they are used.

## Frontend (apps/web)
Runtime libraries:
- React + React DOM: UI rendering.
- Apollo Client + GraphQL: GraphQL client stack for the NestJS API.
- React Router DOM: protected app routing.
- Zustand: lightweight global state store (`auth.store.ts` with localStorage persistence).
- React Hook Form + Zod + @hookform/resolvers: form handling + schema validation.
- Radix UI / shadcn primitives: dialog, sheet, select, tabs, separator, checkbox, label and related UI building blocks.
- Lucide React: icon set.
- Sonner: toast notifications, wrapped by local toast/mutation helpers.
- Recharts: dashboard/report charting.
- @react-pdf/renderer + xlsx: invoice/report/payroll exports.
- @dnd-kit/react + @dnd-kit/helpers: project task kanban drag-and-drop.
- date-fns: date formatting in HR and related screens.
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
- @nestjs/config: environment configuration.
- @nestjs/jwt + @nestjs/passport + passport-jwt: JWT authentication.
- @nestjs/schedule: scheduled expiry/notification jobs.
- @nestjs/platform-express + multer (`@types/multer`): file uploads (Project feed attachments via `POST /uploads/project-feed`).
- graphql-type-json: JSON scalar used by `ProjectFeedEntry.metadata`.
- Prisma + @prisma/adapter-pg + pg: database ORM + Postgres driver.
- bcrypt: password hashing.
- class-validator: DTO validation support where decorators are used.
- dotenv: loads environment variables.
- rxjs, reflect-metadata: NestJS internals.

Tooling / dev:
- Jest + ts-jest + supertest: unit and e2e testing.
- Prettier + ESLint: formatting and linting.
- Nest CLI + schematics: scaffolding.
- TypeScript + ts-node + tsconfig-paths: build/runtime support.

## Notes
- The API code registers GraphQL and Prisma modules in `src/app.module.ts`, along with feature modules (`Auth`, `Users`, `Employees`, `Finance`, `Stock`, `Fleet`, `Projects`, `Notifications`, `Reporting`, `Settings`, `Payroll`).
- Use Bun for dependency and script execution. Do not introduce npm/yarn lockfiles.
