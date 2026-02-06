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
   - `components/`: Componente partajate si primitive UI.
   - `pages/`: Pagini organizate pe module (`hr`, `finance`).
   - `stores/`: State global (Zustand).
 - `src/components/ui/`: primitive UI (Radix + Tailwind + class-variance-authority).
 - `public/`: asset-uri statice.
 - `vite.config.ts`: configurare build.

## apps/api (backend)
 - `src/`: Aplicatie NestJS.
   - `auth/`: Modul autentificare.
   - `users/`: Gestiune utilizatori.
   - `employees/`: Modul HR (Angajati, concedii).
   - `finance/`: Modul Financiar (Parteneri, Facturi, Plati).
 - `src/schema.gql`: Schema GraphQL generata automat.
 - `prisma/schema.prisma`: Schema Prisma (User, Employee, Partner, Invoice, Payment, etc.).
- `prisma.config.ts`: config Prisma cu `DATABASE_URL`.
- `test-db.ts`: test conexiune Prisma + Postgres.
- `test-neon-direct.ts`: test conexiune directa Neon.

## Cum se leaga partile (intentia)
- `apps/web` foloseste Apollo Client + GraphQL pentru API.
- `apps/api` expune un endpoint GraphQL (NestJS + Apollo Server).
- `apps/api` foloseste Prisma + Postgres pentru persistenta datelor.

Nota: Backend-ul conecteaza modulele `Auth`, `Users`, `Employees` si `Finance` in `src/app.module.ts`. GraphQL si Prisma sunt conectate.
