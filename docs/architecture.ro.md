# Arhitectura si Flux de Date (Romana)

## Flux intentionat

1. Web (`apps/web`) randeaza UI in React.
2. Web apeleaza API prin GraphQL (Apollo Client).
3. API (`apps/api`) proceseaza requesturile GraphQL in NestJS (Apollo Server).
4. API citeste/scrie in Postgres prin Prisma.

## Starea backend-ului

`apps/api/src/app.module.ts` inregistreaza urmatoarele module:

| Modul | Responsabilitate |
|---|---|
| `AuthModule` | Login JWT, strategie Passport |
| `UsersModule` | CRUD utilizatori, administrare |
| `EmployeesModule` | Angajati, concedii, aprobari |
| `FinanceModule` | Parteneri, facturi, plati |
| `StockModule` | Depozite, produse, miscari stoc |
| `FleetModule` | Vehicule, documente, kilometraj, leasing, cheltuieli |
| `ReportingModule` | Metrici dashboard (query-uri agregate) |

GraphQL si Prisma sunt conectate complet. `schema.gql` este generat automat la pornire.

## Arhitectura modulului Fleet

Modulul fleet urmeaza acelasi pattern ca toate celelalte module:

- **5 modele Prisma**: `Vehicle`, `VehicleDocument`, `MileageLog`, `VehicleLease`, `VehicleExpense`
- **4 enum-uri**: `FuelType`, `VehicleStatus`, `DocumentType`, `ExpenseType`
- **5 perechi resolver/service**: cate una per entitate, toate inregistrate in `FleetModule`
- **Query cheie**: `expiringDocuments(daysAhead: Int!)` — returneaza numarul de documente grupate pe tip unde `acum ≤ dataExpirare ≤ acum + daysAhead`
- Toate modelele copil au `onDelete: Cascade` pe relatia cu `Vehicle`

## Detalii frontend

- Primitivele UI sunt in `apps/web/src/components/ui` (shadcn/ui: Radix + Tailwind).
- Formularele folosesc React Hook Form + Zod. Campurile numerice folosesc `valueAsNumber: true`.
- State global este gestionat cu Zustand (`auth.store.ts`).
- Toate documentele GraphQL (query-uri + mutatii) sunt in `apps/web/src/graphql/mutations/`.

### Module implementate

| Modul | Pagini | Note |
|---|---|---|
| **Auth** | Login | JWT, rute protejate |
| **HR** | Angajati, Concedii, Aprobari | |
| **Finance** | Overview, Parteneri, Facturi | |
| **Stock** | Overview, Depozite, Produse, Miscari | |
| **Fleet** | Lista vehicule, Creare, Detalii (5 taburi) | Widget dashboard pentru documente expirate |

## Detalii backend

- Conectarea la Postgres foloseste `DATABASE_URL` (vezi `apps/api/prisma.config.ts`).
- Baza de date este pe Neon (Postgres serverless). Prisma engine setat pe `binary`.
- Toate endpoint-urile API sunt protejate cu `JwtAuthGuard`.

## Porturi si runtime

- API asculta pe `process.env.PORT` sau `3000` (vezi `apps/api/src/main.ts`).
- Portul dev pentru web este gestionat de Vite (default 5173).
