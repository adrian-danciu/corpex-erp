# Arhitectura si Flux de Date (Romana)

## Flux intentionat

1. Web (`apps/web`) randeaza UI in React.
2. Web apeleaza API prin GraphQL (Apollo Client).
3. API (`apps/api`) proceseaza requesturile GraphQL in NestJS (Apollo Server).
4. API citeste/scrie in Postgres prin Prisma.

## Starea actuala a backend-ului

- `apps/api/src/app.module.ts` inregistreaza doar `AppController` si `AppService`.
- Dependintele GraphQL si Prisma sunt prezente, dar nu sunt inca legate in module.

## Detalii frontend

- Primitivele UI sunt in `apps/web/src/components/ui` (Radix + Tailwind). (shadcn)
- Formularele folosesc React Hook Form + Zod.
- State global este planificat cu Zustand.

## Detalii backend

- Conectarea la Postgres foloseste `DATABASE_URL` (vezi `apps/api/prisma.config.ts`).
- Schema Prisma defineste `User` si `Role` in `apps/api/prisma/schema.prisma`.
- `apps/api/test-db.ts` este un sanity check pentru DB.

## Porturi si runtime

- API asculta pe `process.env.PORT` sau `3000` (vezi `apps/api/src/main.ts`).
- Portul dev pentru web este gestionat de Vite (default 5173 daca nu e schimbat).
