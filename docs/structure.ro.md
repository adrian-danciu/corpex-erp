# Structura Proiectului (Romana)

## Layout la nivel inalt
```
corpex-erp/
  apps/
    api/       # backend NestJS
    web/       # frontend React (Vite)
  docs/        # documentatie (EN + RO)
  package.json # root minimal (fara scripturi)
```

## apps/web (frontend)
- `src/`: codul UI in React.
- `src/components/ui/`: primitive UI (Radix + Tailwind + class-variance-authority).
- `public/`: asset-uri statice.
- `vite.config.ts`: configurare build.

## apps/api (backend)
- `src/`: aplicatie NestJS (momentan minimal `AppModule`).
- `prisma/schema.prisma`: schema Prisma (User + enum Role).
- `prisma.config.ts`: config Prisma cu `DATABASE_URL`.
- `test-db.ts`: test conexiune Prisma + Postgres.
- `test-neon-direct.ts`: test conexiune directa Neon.

## Cum se leaga partile (intentia)
- `apps/web` foloseste Apollo Client + GraphQL pentru API.
- `apps/api` expune un endpoint GraphQL (NestJS + Apollo Server).
- `apps/api` foloseste Prisma + Postgres pentru persistenta datelor.

Nota: Backend-ul are acum doar `AppController` si `AppService`. GraphQL si Prisma exista ca dependinte, dar nu sunt inca legate in `src/app.module.ts`.
