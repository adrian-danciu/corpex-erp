# Scripturi (Romana)

Scripturile sunt definite pe fiecare app. Ruleaza-le din folderul care contine `package.json`. Proiectul foloseste Bun ca runtime si package manager implicit.

## apps/web
- `bun run dev`: porneste Vite dev server.
- `bun run build`: type-check + build de productie.
- `bun run typecheck`: ruleaza TypeScript fara emitere de fisiere.
- `bun run lint`: ruleaza ESLint.
- `bun run preview`: previzualizeaza build-ul.

Exemplu:
```
cd apps/web
bun run dev
```

## apps/api
- `bun run build`: build pentru NestJS.
- `bun run typecheck`: ruleaza TypeScript pe `tsconfig.build.json` fara emitere de fisiere.
- `bun run format`: Prettier pe src/ si test/.
- `bun run start`: porneste aplicatia.
- `bun run start:dev`: porneste cu watch.
- `bun run start:debug`: debug + watch.
- `bun run start:prod`: ruleaza din `dist/`.
- `bun run lint`: ESLint (cu --fix).
- `bun run test`: teste unit cu Jest.
- `bun run test:watch`: Jest in watch mode.
- `bun run test:cov`: coverage.
- `bun run test:debug`: Jest cu node inspector.
- `bun run test:e2e`: teste e2e.

Exemplu:
```
cd apps/api
bun run start:dev
```

## Scripturi ad-hoc (apps/api)
Comenzi Prisma/setup utile:
- `bunx prisma generate`: regenereaza Prisma Client dupa modificari de schema sau fresh install.
- `bunx prisma migrate dev --name <name>`: creeaza/aplica local o migratie in development.
- `bunx prisma migrate deploy`: aplica migratiile existente in deploy/staging.
- `bunx prisma db seed`: ruleaza `prisma/seed.ts`.

Scripturi ad-hoc mai vechi:
- `test-db.ts`: Prisma + Postgres (create/read/update/delete user).
  - Ruleaza: `cd apps/api && bunx ts-node test-db.ts`
  - Necesita: `DATABASE_URL` in `apps/api/.env`.
- `test-neon-direct.ts`: test conexiune directa Neon.
  - Ruleaza: `cd apps/api && bunx ts-node test-neon-direct.ts`
  - Nota: acest fisier importa `@neondatabase/serverless` care nu este listat in `package.json`. Instaleaza-l daca vrei sa rulezi scriptul.

## Root
- `package.json` din root nu are scripturi; este un placeholder minim.

## Verificare standard inainte de handoff
Pentru schimbari doar pe frontend:
```
cd apps/web
bun run lint
bun run typecheck
bun run build
```

Pentru schimbari doar pe backend:
```
cd apps/api
bun run typecheck
bun run lint
bun run test
```

Pentru schimbari in schema Prisma, ruleaza si `bunx prisma generate` plus comanda de migratie potrivita.
