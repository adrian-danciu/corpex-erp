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
     - `projects/`: Badge status proiect, plus componente de tab in `projects/tabs/` (OverviewTab, TeamTab, MaterialsTab, VehiclesTab, TasksTab, FeedTab, InvoicesTab).
     - `dashboard/`: Widget-uri dashboard (FleetExpiryWidget, MyProjectsWidget, MyTasksWidget, etc.).
   - `pages/`: Pagini organizate pe module.
     - `hr/`: Angajati, Concedii, Aprobari.
     - `finance/`: Overview, Parteneri, Facturi (editorul de factura include picker de proiect + helper pentru import costuri).
     - `stock/`: Depozite, Produse, Miscari de stoc.
     - `fleet/`: Lista vehicule, creare vehicul, detalii vehicul (formularul de cheltuiala include picker de proiect cu valoare implicita).
     - `projects/`: Lista proiecte, creare si detalii proiect (cu taburi).
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
     - `expenses.service.ts` / `expenses.resolver.ts`: Adaugare si stergere cheltuieli (accepta optional `projectId` pentru a atribui costul unui proiect).
   - `projects/`: Modul Proiecte (Proiecte, Membri, Materiale, Vehicule, Task-uri, Feed).
     - `entities/`: GraphQL ObjectType-uri pentru toate modelele de proiect + tipul calculat `ProjectCostRollup`.
     - `dto/`: Input type-uri pentru fiecare mutatie (creare/actualizare proiect, tranzitie status, adaugare/rol/eliminare membru, materiale request/reserve/issue/cancel, vehicule assign/end, task-uri create/update/transition, post in feed).
     - `decorators/project-access.decorator.ts` + `guards/project-access.guard.ts`: RBAC la nivel de proiect (`member` / `manager`). Detecteaza automat contextul de proiect din `taskId`, `projectMaterialId`, `assignmentId`, `feedEntryId` sau `memberId` daca `projectId` nu e furnizat direct.
     - `projects.service.ts` / `projects.resolver.ts`: CRUD proiect, tranzitii ciclu de viata, query rollup costuri.
     - `project-members.service.ts` / `project-members.resolver.ts`: Gestiune membri.
     - `project-materials.service.ts` / `project-materials.resolver.ts`: Flux reserve / issue / cancel; foloseste helperele din `StockService` in tranzactii.
     - `project-vehicles.service.ts` / `project-vehicles.resolver.ts`: Alocari de vehicule cu interval de timp si auto-end al alocarii anterioare; query `currentProjectForVehicle` pentru valoarea implicita.
     - `project-tasks.service.ts` / `project-tasks.resolver.ts`: CRUD task + tranzitii kanban; query `myProjectTasks`.
     - `project-feed.service.ts` / `project-feed.resolver.ts`: Feed combinat (auto + manual). `recordAutoEntry` este consumat de toate celelalte sub-servicii din modul.
     - `project-uploads.controller.ts`: Endpoint REST `POST /uploads/project-feed` pentru atasamente la postari (multer, image+PDF, limita 10MB).
   - `common/`: DTO-uri partajate (PaginationInput, factory Paginated).
   - `reporting/`: Modul metrici dashboard.
   - `settings/`: Setari companie (singleton).
 - `src/schema.gql`: Schema GraphQL generata automat.
 - `prisma/schema.prisma`: Schema Prisma (User, Employee, Partner, Invoice, Vehicle, VehicleDocument, MileageLog, VehicleLease, VehicleExpense, Project, ProjectMember, ProjectMaterial, ProjectVehicle, ProjectTask, ProjectFeedEntry, etc.). `Invoice`, `StockMovement` si `VehicleExpense` au camp optional `projectId`. `ProductStock` are `reservedQty`.
 - `prisma.config.ts`: config Prisma cu `DATABASE_URL`.
 - `uploads/` (in .gitignore): stocare runtime pentru atasamente din feed. Servit la `/uploads/` prin `useStaticAssets`.

## Cum se leaga partile
- `apps/web` foloseste Apollo Client + GraphQL pentru a apela API-ul.
- `apps/api` expune un endpoint GraphQL (NestJS + Apollo Server).
- `apps/api` foloseste Prisma + Postgres (Neon serverless) pentru persistenta datelor.
- Toate modulele urmeaza acelasi pattern: `entities/` → `dto/` → `service` → `resolver` → inregistrat in modul → importat in `AppModule`.
