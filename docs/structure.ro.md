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
     - `ui/`: primitive shadcn/ui (Radix + Tailwind).
     - `common/`: Componente reutilizabile (Pagination, etc.).
     - `fleet/`: Componente specifice flotei (VehicleStatusBadge, DocumentTypeBadge).
     - `dashboard/`: Widget-uri dashboard (FleetExpiryWidget, etc.).
   - `pages/`: Pagini organizate pe module.
     - `hr/`: Angajati, Concedii, Aprobari.
     - `finance/`: Overview, Parteneri, Facturi.
     - `stock/`: Depozite, Produse, Miscari de stoc.
     - `fleet/`: Lista vehicule, creare vehicul, detalii vehicul.
   - `graphql/mutations/`: Documente Apollo `gql` pentru query-uri si mutatii (toate modulele).
   - `types/`: Interfete TypeScript si enum-uri per modul.
   - `lib/schemas/`: Scheme Zod de validare per modul.
   - `stores/`: State global (Zustand).
 - `vite.config.ts`: configurare build Vite.

## apps/api (backend)
 - `src/`: Aplicatie NestJS.
   - `auth/`: Modul autentificare (JWT, Passport).
   - `users/`: Gestiune utilizatori.
   - `employees/`: Modul HR (Angajati, Concedii).
   - `finance/`: Modul Financiar (Parteneri, Facturi, Plati).
   - `stock/`: Modul Stoc (Depozite, Produse, Miscari stoc).
   - `fleet/`: Modul Flota (Vehicule, Documente, Kilometraj, Leasing, Cheltuieli).
     - `entities/`: GraphQL ObjectType-uri pentru toate modelele flotei.
     - `dto/`: Input type-uri pentru toate mutatiile flotei.
     - `vehicles.service.ts` / `vehicles.resolver.ts`: CRUD vehicule + paginare.
     - `vehicle-documents.service.ts` / `vehicle-documents.resolver.ts`: CRUD documente + query expirare.
     - `mileage.service.ts` / `mileage.resolver.ts`: Adaugare si stergere inregistrari kilometraj.
     - `leases.service.ts` / `leases.resolver.ts`: CRUD contracte leasing.
     - `expenses.service.ts` / `expenses.resolver.ts`: Adaugare si stergere cheltuieli.
   - `common/`: DTO-uri partajate (PaginationInput, factory Paginated).
   - `reporting/`: Modul metrici dashboard.
 - `src/schema.gql`: Schema GraphQL generata automat.
 - `prisma/schema.prisma`: Schema Prisma (User, Employee, Partner, Invoice, Vehicle, VehicleDocument, MileageLog, VehicleLease, VehicleExpense, etc.).
 - `prisma.config.ts`: config Prisma cu `DATABASE_URL`.

## Cum se leaga partile
- `apps/web` foloseste Apollo Client + GraphQL pentru a apela API-ul.
- `apps/api` expune un endpoint GraphQL (NestJS + Apollo Server).
- `apps/api` foloseste Prisma + Postgres (Neon serverless) pentru persistenta datelor.
- Toate modulele urmeaza acelasi pattern: `entities/` → `dto/` → `service` → `resolver` → inregistrat in modul → importat in `AppModule`.
