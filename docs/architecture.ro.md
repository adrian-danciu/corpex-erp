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
| `ProjectsModule` | Proiecte client: membri, materiale (rezervare/eliberare), alocari vehicule, task-uri, feed activitate, rollup costuri |
| `ReportingModule` | Metrici dashboard (query-uri agregate) |
| `SettingsModule` | Setari companie (rand singleton) |

GraphQL si Prisma sunt conectate complet. `schema.gql` este generat automat la pornire.

## Arhitectura modulului Fleet

Modulul fleet urmeaza acelasi pattern ca toate celelalte module:

- **5 modele Prisma**: `Vehicle`, `VehicleDocument`, `MileageLog`, `VehicleLease`, `VehicleExpense`
- **4 enum-uri**: `FuelType`, `VehicleStatus`, `DocumentType`, `ExpenseType`
- **5 perechi resolver/service**: cate una per entitate, toate inregistrate in `FleetModule`
- **Query cheie**: `expiringDocuments(daysAhead: Int!)` — returneaza numarul de documente grupate pe tip unde `acum ≤ dataExpirare ≤ acum + daysAhead`
- Toate modelele copil au `onDelete: Cascade` pe relatia cu `Vehicle`
- `VehicleExpense` are un camp optional `projectId` pentru ca cheltuielile cu combustibilul sau reparatiile sa fie atribuite unui proiect

## Arhitectura modulului Projects

Modulul projects este un hub transversal care leaga Partners, Stock, Fleet, HR, Tasks si Finance. Un proiect reprezinta o lucrare livrata catre un client.

- **6 modele Prisma**: `Project`, `ProjectMember`, `ProjectMaterial`, `ProjectVehicle`, `ProjectTask`, `ProjectFeedEntry`
- **6 enum-uri**: `ProjectStatus`, `ProjectMemberRole`, `ProjectMaterialStatus`, `ProjectTaskStatus`, `ProjectTaskPriority`, `ProjectFeedKind`
- **6 perechi service/resolver**: `Projects`, `ProjectMembers`, `ProjectMaterials`, `ProjectVehicles`, `ProjectTasks`, `ProjectFeed`
- **Permisiuni:** cheie noua `projects: AccessLevel` in `permissions.config.ts`. Accesul la nivel de proiect este controlat prin `ProjectAccessGuard` (niveluri `member` / `manager`) si decoratorul `@RequireProjectAccess`.
- **Punte cu alte module:**
  - `Invoice.projectId` — leaga o factura de un proiect. In plus, query-ul `projectCostsForInvoice(projectId)` agrega materialele eliberate si cheltuielile cu vehiculele atribuite proiectului in linii de factura draft.
  - `StockMovement.projectId` si `StockMovement.projectMaterialId` — eliberarile de marfa sunt inregistrate impotriva alocarii din proiect.
  - `ProductStock.reservedQty` — urmarit per depozit/produs; `availableQty = quantity − reservedQty`.
  - `VehicleExpense.projectId` — vezi sectiunea Fleet.
- **Helpere stoc (in `StockService`)** consumate de fluxul de materiale: `reserveStock`, `releaseReservation`, `issueStock`. Toate trei accepta optional un client de tranzactie Prisma.
- **Upload de fisiere** (postari manuale in feed): endpoint REST `POST /uploads/project-feed` (multer, image+PDF, limita 10MB). Fisierele sunt stocate in `apps/api/uploads/project-feed/` si servite prin `useStaticAssets` la `/uploads/`.
- **Ciclu de viata:** `PLANNING → ACTIVE → ON_HOLD ⇄ ACTIVE → COMPLETED | CANCELLED`. `COMPLETED` cere ca nicio alocare de material sa nu fie deschisa; `CANCELLED` elibereaza toate rezervarile deschise.
- **Flux de materiale:** `REQUESTED → RESERVED → PARTIALLY_ISSUED → FULLY_ISSUED` (sau `CANCELLED` din orice stare anterioara eliberarii). Rezervarea este totul-sau-nimic; eliberarea poate fi partiala.

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
| **Projects** | Lista proiecte, Creare, Detalii (7 taburi: Overview / Echipa / Materiale / Vehicule / Task-uri (kanban) / Feed / Facturi) | Widget-uri dashboard "Proiectele mele" si "Task-uri atribuite mie"; editorul de factura include un buton "Importa costuri din proiect" |

## Detalii backend

- Conectarea la Postgres foloseste `DATABASE_URL` (vezi `apps/api/prisma.config.ts`).
- Baza de date este pe Neon (Postgres serverless). Prisma engine setat pe `binary`.
- Toate endpoint-urile API sunt protejate cu `JwtAuthGuard`.

## Porturi si runtime

- API asculta pe `process.env.PORT` sau `3000` (vezi `apps/api/src/main.ts`).
- Portul dev pentru web este gestionat de Vite (default 5173).
