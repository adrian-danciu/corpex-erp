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
| `StockModule` | Depozite, produse, miscari stoc, comenzi furnizori si marfa in tranzit (receptii NIR), gestionare stoc defect |
| `FleetModule` | Vehicule, documente, kilometraj, leasing, cheltuieli |
| `ProjectsModule` | Proiecte client: membri, materiale (rezervare/eliberare), alocari vehicule, task-uri, feed activitate, rollup costuri |
| `NotificationsModule` | Notificari in-app, bell/inbox, scheduler pentru expirari documente flota si angajati, evenimente stoc/concedii/task-uri |
| `ReportingModule` | Metrici dashboard (query-uri agregate) |
| `SettingsModule` | Setari companie (rand singleton), praguri expirare flota, reguli taxe payroll |
| `PayrollModule` | Perioade payroll lunare, linii payroll, calcul brut-net romanesc, suport contractor B2B |

GraphQL si Prisma sunt conectate complet. `schema.gql` este generat automat la pornire.

## Documente angajati

Modulul HR stocheaza acum documente pentru angajati si date de expirare.

- **Schema**: `EmployeeDocument` apartine unui `Employee` si pastreaza tipul, titlul, metadata fisierului, `expiryDate` optional, note, uploader si timestamp-uri.
- **Upload**: fisierele sunt incarcate prin API si afisate atat in pagina dedicata Documents, cat si in panoul de documente din Employee Detail.
- **Notificari expirare**: documentele care expira curand emit `EMPLOYEE_DOCUMENT_EXPIRING` catre utilizatorii HR si Management.

## Generare conturi din angajati

Crearea conturilor este acum employee-first. HR creeaza intai angajatul, apoi HR/IT/Admin pot genera contul de utilizator legat din Employee Detail sau in bulk din tabela Employees.

- **Credentiale generate**: email-ul foloseste numele normalizat sub `@corpex.com` (`ana.smith@corpex.com`). Daca exista deja, se adauga un sufix numeric (`ana.smith2@corpex.com`).
- **Parola temporara**: se genereaza din local part-ul emailului si anul curent (`ana.smith.2026`) si este afisata o singura data in tabelul de rezultate.
- **Prima logare**: conturile generate seteaza `User.mustChangePassword = true`; frontend-ul redirectioneaza acesti utilizatori la `/change-password` pana schimba parola temporara.
- **Model permisiuni**: conturile generate au `User.role = USER`; accesul pe module continua sa vina din `Employee.department`. IT are acces HR read ca sa poata crea conturi fara sa editeze fise de angajat.

## Modulul Payroll

Payroll este un modul dedicat pentru calculul salariilor lunare.

- **Schema**: `PayrollPeriod` contine `PayrollLine`. O perioada este unica pe `(year, month)` si trece prin `DRAFT -> APPROVED -> PAID`.
- **Permisiuni**: HR, Finance si Management au acces write; Warehouse, Fleet si IT nu au acces payroll. Admin are bypass.
- **Flux**:
  - `generatePayroll` creeaza un draft din angajatii cu salariu brut mai mare decat `0`.
  - `updatePayrollLine` editeaza bonus, deduceri manuale si note doar in draft.
  - `approvePayroll` blocheaza draftul.
  - `markPayrollPaid` marcheaza o perioada aprobata ca platita.
  - `deletePayrollPeriod` sterge doar perioade `DRAFT`.
- **Moneda**: salariul angajatului si payroll-ul sunt tratate in EUR.
- **Reguli taxe romanesti**: setarile din `CompanySettings` pornesc cu CAS `25%`, CASS `10%`, impozit venit `10%`, CAM `2.25%`, deducere personala `0`, versiune regula `RO_2026_STANDARD`.
- **Snapshot**: liniile generate pastreaza sumele, ratele si versiunea de reguli folosite la generare; modificarile ulterioare de setari/angajat nu rescriu perioadele vechi.
- **Contractori B2B**: `Employee.isContractor` marcheaza contractorii. Acestia apar in payroll, dar CAS/CASS/impozit/CAM sunt `0`; netul este brutul taxabil minus deduceri manuale.
- **UI**: `/payroll` afiseaza lista de perioade, carduri sumar, tabel draft editabil, tooltip pentru taxe, CAM si cost total angajator, export PDF/Excel, aprobare/plata si stergere draft.

## Exporturi rapoarte

Rapoartele pot fi exportate PDF si Excel. Librariile grele sunt izolate in `apps/web/src/lib/report-export.tsx` si incarcate lazy de paginile de rapoarte/payroll.

## Arhitectura refactorizarii frontend

Cleanup-ul recent a mutat comportamentul repetat din pagini in utilitare comune si controllere locale pe feature, pastrand routing-ul si data loading-ul usor de urmarit.

- **Utilitare comune**: `apps/web/src/lib/formatters.ts` centralizeaza formatari pentru bani/date/cantitati/bytes cu default-uri romanesti. `apps/web/src/lib/download.ts` centralizeaza download-uri de blob/URL.
- **Hook-uri partajate**: `useUrlFilters` tine filtrele de lista in URL search params; `useDisclosure` gestioneaza open/close pentru dialoguri simple; `useMutationWithToast` pastreaza feedback-ul mutatiilor consistent.
- **Hook-uri controller locale**: `useVehicleDetailController`, `usePayrollController` si `useMaterialAllocation` tin state-ul de workflow si mutation handlers pentru ecrane dense. Nu muta campurile de formular in Zustand; React Hook Form ramane owner-ul state-ului de formular.
- **Split pe workflow**: taburile de vehicle detail sunt in `pages/fleet/components/`, subview-urile payroll in `pages/payroll/components/`, controalele de tabel/export rapoarte in `pages/reports/components/`, iar subcomponentele pentru task/material/service proiect in `components/projects/`.
- **React Hook Form watchers**: cand o valoare urmarita este folosita in render, prefera `useWatch({ control, name })` in loc de `watch("field")` direct.
- **Nota build**: code-splitting-ul pe rute tine entry-ul aplicatiei sub pragul Vite de 500 kB. Exporturile PDF si XLSX sunt incarcate prin dynamic imports la nivel de actiune, cu chunk-uri separate `pdf-export` si `xlsx-export`. Vendorii de vizualizare sunt impartiti pe scop (`charts-vendor`, `kanban-vendor`). Vite inca raporteaza chunk-ul PDF lazy ca mare deoarece `@react-pdf/renderer` este greu.

## Arhitectura modulului Fleet

Modulul fleet urmeaza acelasi pattern ca toate celelalte module:

- **5 modele Prisma**: `Vehicle`, `VehicleDocument`, `MileageLog`, `VehicleLease`, `VehicleExpense`
- **4 enum-uri**: `FuelType`, `VehicleStatus`, `DocumentType`, `ExpenseType`
- **5 perechi resolver/service**: cate una per entitate, toate inregistrate in `FleetModule`
- **Query cheie**: `expiringDocuments(daysAhead: Int!)` — returneaza numarul de documente grupate pe tip unde `acum ≤ dataExpirare ≤ acum + daysAhead`
- Toate modelele copil au `onDelete: Cascade` pe relatia cu `Vehicle`
- `VehicleExpense` are un camp optional `projectId` pentru ca cheltuielile cu combustibilul sau reparatiile sa fie atribuite unui proiect

## Modulul Stock — comenzi furnizori si marfa in tranzit

Pe langa stratul de baza depozit/produs/miscare, modulul stoc gestioneaza si aprovizionarea de la furnizori, astfel incat depozitul sa urmareasca "marfa in tranzit" (bunuri comandate, dar inca neajunse), una dintre ideile principale din planul lucrarii de licenta.

- **4 modele Prisma**: `PurchaseOrder`, `PurchaseOrderLine`, `PurchaseOrderReceipt`, `PurchaseOrderReceiptLine` plus enum-ul `PurchaseOrderStatus` (`DRAFT → ORDERED → PARTIALLY_RECEIVED → FULLY_RECEIVED`, sau `CANCELLED` din orice stare non-terminala).
- **Numerotare**: PO si NIR folosesc `series + Int @default(autoincrement())` cu `@@unique([series, number])`, exact ca `Invoice`. Afisarea este cu zero-padding (`PO-000123`, `NIR-000045`) prin resolver field-urile `formattedNumber`.
- **Receptia scrie in stoc**: `recordPurchaseOrderReceipt` ruleaza intr-o singura `prisma.$transaction` care incrementeaza `PurchaseOrderLine.qtyReceived`, face upsert pe `ProductStock.quantity`, recalculeaza `Product.currentStock` si scrie cate un `StockMovement { type: IN }` per linie de receptie (cu foreign key `purchaseReceiptLineId` pentru trasabilitate). Apoi statusul avanseaza automat la `PARTIALLY_RECEIVED` sau `FULLY_RECEIVED`.
- **Marfa in tranzit este calculata, nu stocata**: nu exista coloana `inTransitQty` — se calculeaza la cerere prin `purchaseOrderLine.findMany` filtrat pe `order.status ∈ {ORDERED, PARTIALLY_RECEIVED}` si se expune ca resolver field pe `Product.inTransitQty(warehouseId)` / `ProductStock.inTransitQty`. Query-urile top-level `inTransitSummary(warehouseId)` si `inTransitByProduct(productId, warehouseId)` alimenteaza widgetul de pe dashboard.
- **Permisiuni**: refoloseste cheia existenta `stock: read | write` — nu e nevoie de un mapping nou de departament. Anularea este permisa pentru `DRAFT`/`ORDERED`/`PARTIALLY_RECEIVED`; stergerea — doar cat timp PO este `DRAFT` fara nicio receptie; receptiile peste cantitatea comandata sunt respinse.
- **Frontend**: `apps/web/src/pages/stock/PurchaseOrders*.tsx` (lista / creare / detaliu cu taburile Overview / Lines / Receptions), `apps/web/src/components/stock/{PurchaseOrderStatusBadge,PurchaseOrderLineEditor,RecordReceptionSheet,InTransitWidget}.tsx`. Pagina de overview a stocului inglobeaza widgetul de in-tranzit; pagina de produse adauga o coloana "In transit" alimentata din `inTransitSummary`.

## Modulul Stock — stoc defect

Planul lucrarii de licenta cere urmarirea a trei "buckets" de stoc in timp real per (produs, depozit): **disponibil**, **rezervat** si **defect**. Bucket-ul de defect permite operatorului din depozit sa scoata din vanzare unitatile deteriorate fara sa piarda trasabilitatea — pot fi mai apoi returnate furnizorului sau casate.

- **Schema**: `ProductStock` a primit coloana `defectiveQty Float @default(0)` langa `quantity` si `reservedQty`. Enum-ul `StockMovementType` are doua valori noi, `DEFECT` si `SCRAP`, asa incat fiecare tranzitie lasa o intrare in `StockMovement` ca audit trail.
- **Formula buckets (o singura sursa adevarului)**: `availableQty = quantity − reservedQty − defectiveQty`. Resolver-ul se afla in `apps/api/src/stock/product-stock.resolver.ts` si este singurul loc unde formula este calculata pentru API. `Product.currentStock` a fost redefinit ca suma vandabila pe toate depozitele: `SUM(quantity − defectiveQty)`. Helper-ul privat `recomputeProductCurrentStock(productId, tx)` din `StockService` este reutilizat de fiecare mutatie care atinge un `ProductStock`, astfel incat alertele de stoc minim nu mai confunda unitatile defecte cu marfa sanatoasa.
- **Doua mutatii, doua fluxuri**:
  - `markStockDefective(input)` (tip miscare `DEFECT`) muta unitati din bucket-ul sanatos in cel defect. `quantity` ramane aceeasi; stocul vandabil scade. Garda: nu poate marca mai mult decat `quantity − reservedQty − defectiveQty` (sanatos-nerezervat) din depozitul ales.
  - `scrapDefectiveStock(input)` (tip miscare `SCRAP`) elimina definitiv unitati din bucket-ul defect — scade simultan `defectiveQty` si `quantity` cu aceeasi cantitate, apoi recalculeaza `Product.currentStock`. Garda: nu poate casa mai mult decat `defectiveQty` curent.
- **Modificari in fluxurile existente**: `reserveStock` si `issueStock` scad acum `defectiveQty` cand verifica disponibilul, astfel incat rezervarile si eliberarile catre proiecte sa nu consume accidental unitati defecte. `createStockMovement` blocheaza miscarile `OUT` care ar coborî in bucket-ul defect si respinge valorile `ADJUSTMENT` sub `defectiveQty` curent (utilizatorul trebuie sa caseze explicit unitatile defecte).
- **Notificari**: `markStockDefective` refoloseste helper-ul `maybeEmitLowStock`, deci trecerea unitatilor in defect poate declansa o notificare `STOCK_BELOW_MINIMUM` daca stocul vandabil coboara sub `Product.minimumStock`.
- **Permisiuni**: ambele mutatii refolosesc cheia existenta `stock: write`.
- **Frontend**: `apps/web/src/components/stock/DefectiveStockSheet.tsx` — un sheet din dreapta deschis dintr-o actiune pe randul produsului (buton-icon `PackageX`). Afiseaza breakdown-ul per depozit (On hand / Reserved / Defective / Available), comuta intre modurile "Report defective" si "Scrap defective", valideaza cantitatea pe client pe baza limitei respective si re-fetcheaza overview-ul stocului, lista de low-stock si lista de produse dupa o mutatie reusita. `availableQty` si `defectiveQty` sunt expuse in `GET_PRODUCT_STOCK_BY_PRODUCT_QUERY`.

## Arhitectura modulului Projects

Modulul projects este un hub transversal care leaga Partners, Stock, Fleet, HR, Tasks si Finance. Un proiect reprezinta o lucrare livrata catre un client.

- **7 modele Prisma**: `Project`, `ProjectMember`, `ProjectMaterial`, `ProjectVehicle`, `ProjectTask`, `ProjectTaskComment`, `ProjectFeedEntry`
- **6 enum-uri**: `ProjectStatus`, `ProjectMemberRole`, `ProjectMaterialStatus`, `ProjectTaskStatus`, `ProjectTaskPriority`, `ProjectFeedKind`
- **7 perechi service/resolver**: `Projects`, `ProjectMembers`, `ProjectMaterials`, `ProjectVehicles`, `ProjectTasks`, `ProjectTaskComments`, `ProjectFeed`
- **Permisiuni:** cheie noua `projects: AccessLevel` in `permissions.config.ts`. Accesul la nivel de proiect este controlat prin `ProjectAccessGuard` (niveluri `member` / `manager`) si decoratorul `@RequireProjectAccess`.
- **Punte cu alte module:**
  - `Invoice.projectId` — leaga o factura de un proiect. In plus, query-ul `projectCostsForInvoice(projectId)` agrega materialele eliberate si cheltuielile cu vehiculele atribuite proiectului in linii de factura draft.
  - `StockMovement.projectId` si `StockMovement.projectMaterialId` — eliberarile de marfa sunt inregistrate impotriva alocarii din proiect.
  - `ProductStock.reservedQty` si `ProductStock.defectiveQty` — urmarite per depozit/produs; `availableQty = quantity − reservedQty − defectiveQty`.
  - `VehicleExpense.projectId` — vezi sectiunea Fleet.
- **Helpere stoc (in `StockService`)** consumate de fluxul de materiale: `reserveStock`, `releaseReservation`, `issueStock`. Toate trei accepta optional un client de tranzactie Prisma.
- **Upload de fisiere** (postari manuale in feed): endpoint REST `POST /uploads/project-feed` (multer, image+PDF, limita 10MB). Fisierele sunt stocate in `apps/api/uploads/project-feed/` si servite prin `useStaticAssets` la `/uploads/`.
- **Ciclu de viata:** `PLANNING → ACTIVE → ON_HOLD ⇄ ACTIVE → COMPLETED | CANCELLED`. `COMPLETED` cere ca nicio alocare de material sa nu fie deschisa; `CANCELLED` elibereaza toate rezervarile deschise.
- **Flux de materiale:** `REQUESTED → RESERVED → PARTIALLY_ISSUED → FULLY_ISSUED` (sau `CANCELLED` din orice stare anterioara eliberarii). Rezervarea este totul-sau-nimic; eliberarea poate fi partiala.
- **UX Task-uri:** tab-ul Tasks este un kanban in stil Jira construit pe `@dnd-kit/react` cu scrieri optimiste in cache-ul Apollo (fara `refetch()` dupa un drag). Click pe un card deschide un `Sheet` lateral dreapta (`TaskDetailSheet`) cu editare inline a titlului/descrierii/prioritatii/assignee-ului/datei limita, select de status, un timeline de activitate care imbina intrarile din `ProjectFeedEntry` filtrate dupa task (prin `metadata.taskId`) cu randuri `ProjectTaskComment` plate, plus un composer de comentarii (Cmd/Ctrl+Enter pentru trimitere). Permisiuni: project managers / admin / MANAGEMENT pot edita orice camp si pot sterge task-ul; assignee-ul poate schimba statusul si poate comenta; ceilalti membri pot doar comenta; editarea/stergerea unui comentariu necesita ca actorul sa fie autorul sau admin. Adaugiri backend: modelul `ProjectTaskComment` (cascade-delete cand task-ul este sters), mutatiile `addProjectTaskComment` / `updateProjectTaskComment` / `deleteProjectTaskComment` / `deleteProjectTask` si query-ul `projectTaskActivity(taskId)` care filtreaza feed-ul proiectului dupa `metadata.taskId`. Codul frontend este in `apps/web/src/components/projects/tasks/`.

## Detalii frontend

- Primitivele UI sunt in `apps/web/src/components/ui` (shadcn/ui: Radix + Tailwind).
- Formularele folosesc React Hook Form + Zod. Campurile numerice folosesc `valueAsNumber: true`.
- State global este gestionat cu Zustand (`auth.store.ts`).
- Documentele GraphQL sunt migrate treptat spre `graphql/queries/`, `graphql/mutations/` si `graphql/fragments/`. Unele fisiere legacy `*.mutations.ts` inca au query-uri si mutatii mixte pentru compatibilitate.

### Module implementate

| Modul | Pagini | Note |
|---|---|---|
| **Auth** | Login | JWT, rute protejate |
| **HR** | Angajati, Concedii, Aprobari | |
| **Finance** | Overview, Parteneri, Facturi | |
| **Stock** | Overview (cu widget marfa in tranzit), Depozite, Produse (cu coloana "In transit" + sheet stoc defect), Miscari, Comenzi furnizori (lista / creare / detaliu) | Aprovizionare de la furnizori + flux receptie NIR; bucket de stoc defect per depozit cu actiuni report/scrap |
| **Fleet** | Lista vehicule, Creare, Detalii (5 taburi) | Widget dashboard pentru documente expirate |
| **Projects** | Lista proiecte, Creare, Detalii (7 taburi: Overview / Echipa / Materiale / Vehicule / Task-uri (kanban) / Feed / Facturi) | Widget-uri dashboard "Proiectele mele" si "Task-uri atribuite mie"; editorul de factura include un buton "Importa costuri din proiect" |
| **Documente Angajati** | Documents, panou in Employee Detail | Upload documente, expiry date, notificari expirare |
| **Payroll** | Payroll | Generare draft lunar, taxe romanesti, contractor B2B, export PDF/Excel, aprobare/plata/stergere draft |
| **Rapoarte** | Reports | Export PDF/Excel |

## Detalii backend

- Conectarea la Postgres foloseste `DATABASE_URL` (vezi `apps/api/prisma.config.ts`).
- Baza de date este pe Neon (Postgres serverless). Prisma engine setat pe `binary`.
- Toate endpoint-urile API sunt protejate cu `JwtAuthGuard`.

## Porturi si runtime

- API asculta pe `process.env.PORT` sau `3000` (vezi `apps/api/src/main.ts`).
- Portul dev pentru web este gestionat de Vite (default 5173).
