# Scripts (English)

Scripts are defined per app. Run them from the app folder that owns the `package.json`. This project uses Bun as the default runtime and package manager.

## apps/web
- `bun run dev`: start Vite dev server.
- `bun run build`: type-check + production build.
- `bun run typecheck`: run TypeScript project references without emitting files.
- `bun run lint`: run ESLint.
- `bun run preview`: preview production build.

Example:
```
cd apps/web
bun run dev
```

## apps/api
- `bun run build`: build NestJS app.
- `bun run typecheck`: run TypeScript against `tsconfig.build.json` without emitting files.
- `bun run format`: run Prettier on src/ and test/.
- `bun run start`: start NestJS app.
- `bun run start:dev`: start with watch mode.
- `bun run start:debug`: start in debug + watch.
- `bun run start:prod`: run compiled app from `dist/`.
- `bun run lint`: ESLint (with --fix).
- `bun run test`: Jest unit tests.
- `bun run test:watch`: Jest in watch mode.
- `bun run test:cov`: Jest coverage.
- `bun run test:debug`: Jest with node inspector.
- `bun run test:e2e`: e2e tests.

Example:
```
cd apps/api
bun run start:dev
```

## Ad-hoc scripts (apps/api)
Useful Prisma/setup commands:
- `bunx prisma generate`: regenerate Prisma Client after schema changes or fresh install.
- `bunx prisma migrate dev --name <name>`: create/apply a local migration during development.
- `bunx prisma migrate deploy`: apply existing migrations in deploy/staging.
- `bunx prisma db seed`: run `prisma/seed.ts`.

Older ad-hoc scripts:
- `test-db.ts`: uses Prisma + Postgres to create/read/update/delete a user.
  - Run: `cd apps/api && bunx ts-node test-db.ts`
  - Requires: `DATABASE_URL` in `apps/api/.env`.
- `test-neon-direct.ts`: tests direct Neon connection.
  - Run: `cd apps/api && bunx ts-node test-neon-direct.ts`
  - Note: this file imports `@neondatabase/serverless` which is not listed in `package.json`. Install it if you plan to run this script.

## Root
- Root `package.json` has no scripts; it is a minimal bun init placeholder.

## Standard verification before handoff
For frontend-only changes:
```
cd apps/web
bun run lint
bun run typecheck
bun run build
```

For backend-only changes:
```
cd apps/api
bun run typecheck
bun run lint
bun run test
```

For changes touching Prisma schema, also run `bunx prisma generate` and the appropriate migration command.
