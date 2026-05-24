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
     - `ui/`: primitive shadcn/ui (Radix + Tailwind), inclusiv tooltip si checkbox.
     - `common/`: Componente reutilizabile (Pagination, etc.).
     - `fleet/`: Componente specifice flotei (VehicleStatusBadge, DocumentTypeBadge).
     - `projects/`: Badge status proiect, plus componente de tab in `projects/tabs/` (OverviewTab, TeamTab, MaterialsTab, VehiclesTab, TasksTab, FeedTab, InvoicesTab).
       - `projects/tabs/materials/`: Tabel si dialoguri extrase din tabul Materials.
       - `projects/tabs/services/`: Tabel si dialog extrase din tabul Services.
       - `projects/tasks/detail/`: Panouri dedicate pentru task detail si confirmarea de stergere.
     - `dashboard/`: Widget-uri dashboard (FleetExpiryWidget, MyProjectsWidget, MyTasksWidget, etc.).
   - `pages/`: Pagini organizate pe module.
     - `hr/`: Angajati, Concedii, Aprobari, detalii angajat.
     - `finance/`: Overview, Parteneri, Facturi (editorul de factura include picker de proiect + helper pentru import costuri).
     - `stock/`: Depozite, Produse, Miscari de stoc.
     - `fleet/`: Lista vehicule, creare vehicul, detalii vehicul. Taburile/dialogurile de detaliu sunt in `pages/fleet/components/`; state-ul de workflow este in `pages/fleet/hooks/useVehicleDetailController.ts`.
     - `projects/`: Lista proiecte, creare si detalii proiect (cu taburi).
     - `payroll/`: Pagina payroll cu `components/`, `hooks/usePayrollController.ts` si `utils.ts` locale.
     - `DocumentsPage.tsx`: overview pentru documente angajati.
     - `ReportsPage.tsx`: rapoarte cu export PDF/Excel; componente reutilizabile in `pages/reports/components/`.
   - `graphql/mutations/`: Documente Apollo `gql` pentru mutatii si fisiere legacy mixte.
   - `graphql/queries/`: Query-uri Apollo pentru module migrate.
   - `graphql/fragments/`: Fragmente GraphQL partajate pentru selectii repetate.
   - `types/`: Interfete TypeScript si enum-uri per modul.
   - `hooks/`: Hook-uri partajate (`usePagination`, `useUrlFilters`, `useDisclosure`, `useMutationWithToast`, `useCurrency`, notificari).
   - `lib/`: Utilitare partajate (`formatters.ts`, `download.ts`, Apollo client, mirror de permisiuni, constante, scheme).
   - `lib/schemas/`: Scheme Zod de validare per modul.
   - `stores/`: State global (Zustand).
 - `vite.config.ts`: configurare build Vite.

## apps/api (backend)
 - `src/`: Aplicatie NestJS.
   - `auth/`: Modul autentificare (JWT, Passport).
   - `users/`: Gestiune utilizatori.
   - `employees/`: Modul HR (Angajati, Documente Angajati, Concedii).
   - `finance/`: Modul Financiar (Parteneri, Facturi, Plati).
   - `stock/`: Modul Stoc (Depozite, Produse, Miscari stoc, Comenzi furnizori).
     - `stock.service.ts`: Fatada publica pentru catalog si helpere de stoc consumate de alte module.
     - `stock-ledger.service.ts`: Logica tranzactionala pentru miscari, rezervari, eliberari, defect si casare.
     - `purchase-orders.service.ts`: Fatada publica pentru CRUD/status/in-tranzit.
     - `purchase-order-receiving.service.ts`: Logica de receptie NIR, incrementare stoc si actualizare status PO.
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
   - `common/`: DTO-uri si helpere partajate (`PaginationInput`, factory Paginated, normalizare/rezultat paginare).
   - `reporting/`: Modul metrici dashboard.
   - `settings/`: Setari companie (singleton).
   - `payroll/`: Perioade payroll, linii payroll, calcul taxe romanesti, ciclu draft/aprobat/platit si stergere draft.
 - `src/schema.gql`: Schema GraphQL generata automat.
 - `prisma/schema.prisma`: Schema Prisma (User, Employee, EmployeeDocument, PayrollPeriod, PayrollLine, Partner, Invoice, Vehicle, VehicleDocument, MileageLog, VehicleLease, VehicleExpense, Project, ProjectMember, ProjectMaterial, ProjectVehicle, ProjectTask, ProjectFeedEntry, PurchaseOrder, PurchaseOrderReceipt, etc.). `Invoice`, `StockMovement` si `VehicleExpense` au camp optional `projectId`. `ProductStock` are `reservedQty` si `defectiveQty`.
 - `prisma.config.ts`: config Prisma cu `DATABASE_URL`.
 - `uploads/` (in .gitignore): stocare runtime pentru atasamente din feed. Servit la `/uploads/` prin `useStaticAssets`.

## Cum se leaga partile
- `apps/web` foloseste Apollo Client + GraphQL pentru a apela API-ul.
- `apps/api` expune un endpoint GraphQL (NestJS + Apollo Server).
- `apps/api` foloseste Prisma + Postgres (Neon serverless) pentru persistenta datelor.
- Toate modulele urmeaza acelasi pattern: `entities/` → `dto/` → `service` → `resolver` → inregistrat in modul → importat in `AppModule`.
- Salariul angajatului este obligatoriu si reprezinta salariul brut lunar in EUR. `Employee.isContractor` marcheaza contractorii B2B, pentru care payroll nu aplica taxele salariale si CAM.
- Paginile frontend refactorizate trebuie sa ramana subtiri: data loading/routing in pagina, state de workflow in hook local pe feature, UI repetat in componente focusate.
