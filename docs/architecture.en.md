# Architecture & Data Flow (English)

## Intended flow

1. Web app (`apps/web`) renders UI with React.
2. Web app calls the API via GraphQL (Apollo Client).
3. API (`apps/api`) handles GraphQL requests in NestJS (Apollo Server).
4. API reads/writes to Postgres using Prisma.

## Backend state

`apps/api/src/app.module.ts` registers the following modules:

| Module | Responsibility |
|---|---|
| `AuthModule` | JWT login, Passport strategy |
| `UsersModule` | User CRUD, admin management |
| `EmployeesModule` | Employees, leave requests, approvals |
| `FinanceModule` | Partners, invoices, payments |
| `StockModule` | Warehouses, products, stock movements, supplier purchase orders & in-transit goods (NIR receptions), defective-stock handling |
| `FleetModule` | Vehicles, documents, mileage logs, leases, expenses |
| `ProjectsModule` | Client-job projects: members, materials (reserve/issue), vehicle assignments, tasks, activity feed, cost rollup |
| `NotificationsModule` | In-app notifications, bell/inbox support, fleet and employee document expiry scheduler, stock/leave/project-task events |
| `ReportingModule` | Dashboard metrics (aggregated queries) |
| `SettingsModule` | Company-wide settings (singleton row), fleet expiry thresholds, payroll tax rules |
| `PayrollModule` | Monthly payroll periods and lines, Romanian gross-to-net calculations, B2B contractor handling |

GraphQL and Prisma are fully wired. `schema.gql` is auto-generated at startup.

## HR document storage

The HR module now stores employee documents and expiry dates.

- **Schema**: `EmployeeDocument` belongs to `Employee` and records type, title, file metadata, optional `expiryDate`, notes, uploader and timestamps.
- **Upload flow**: employee document files are uploaded through the API and listed in both the dedicated Documents page and the Employee Detail document panel.
- **Expiry notifications**: documents with upcoming expiry dates create `EMPLOYEE_DOCUMENT_EXPIRING` notifications for HR and Management users.
- **Frontend**: `/documents` is available as a menu item; employee detail includes an `EmployeeDocumentsPanel`.

## Employee-driven account generation

Account creation is now employee-first. HR creates the employee record, then HR/IT/Admin can generate the linked user account from Employee Detail or bulk-generate accounts from the Employees table.

- **Generated credentials**: email uses the normalized employee name under `@corpex.com` (`ana.smith@corpex.com`). If the email already exists, a numeric suffix is appended (`ana.smith2@corpex.com`).
- **Temporary password**: generated from the same local part and current year (`ana.smith.2026`) and shown once in the UI result table.
- **First-login policy**: generated accounts set `User.mustChangePassword = true`; the frontend redirects those users to `/change-password` until they successfully change the temporary password.
- **Permissions model**: generated employee accounts use `User.role = USER`; module access continues to come from the linked `Employee.department`. IT has HR read access so it can create accounts without being able to edit employee records.

## Payroll module architecture

Payroll is a dedicated module for monthly salary calculations.

- **Schema**: `PayrollPeriod` owns `PayrollLine` rows. A period is unique by `(year, month)` and moves through `DRAFT -> APPROVED -> PAID`.
- **Permissions**: HR, Finance and Management have payroll write access; Warehouse, Fleet and IT have no payroll access. Admin bypasses module restrictions.
- **Lifecycle**:
  - `generatePayroll` creates a draft from employees with gross salary greater than `0`.
  - `updatePayrollLine` can edit bonus, manual deductions and notes while the period is draft.
  - `approvePayroll` locks a draft.
  - `markPayrollPaid` marks an approved period paid.
  - `deletePayrollPeriod` deletes draft periods only.
- **Currency**: employee salary and payroll are treated as EUR.
- **Romanian tax rules**: payroll settings live in `CompanySettings` and default to CAS `25%`, CASS `10%`, income tax `10%`, CAM `2.25%`, personal deduction `0`, rule version `RO_2026_STANDARD`.
- **Snapshot behavior**: generated payroll lines store the tax amounts, rates and rule version used at generation time; later settings/employee edits do not rewrite old periods.
- **B2B contractors**: `Employee.isContractor` marks B2B contractors. Contractors are included in payroll but CAS/CASS/income tax/CAM are `0`; net equals taxable gross minus manual deductions.
- **UI**: `/payroll` shows period list, summary cards, editable draft table, tax breakdown tooltips, CAM and total employer cost, PDF/Excel export, approve/paid actions and draft deletion.

## Reporting exports

Reports support client-side PDF and Excel export. The heavy export libraries are isolated in `apps/web/src/lib/report-export.tsx` and lazy-loaded by report/payroll pages.

## Frontend refactor architecture

Recent cleanup moved repeated page behavior into shared utilities and feature-local controllers while keeping routing/data loading easy to follow.

- **Shared utilities**: `apps/web/src/lib/formatters.ts` centralizes money/date/quantity/byte formatting with Romanian defaults. `apps/web/src/lib/download.ts` centralizes blob/URL downloads.
- **Shared hooks**: `useUrlFilters` stores shareable list filters in URL search params; `useDisclosure` handles simple open/close dialog state; `useMutationWithToast` keeps mutation feedback consistent.
- **Feature controller hooks**: `useVehicleDetailController`, `usePayrollController` and `useMaterialAllocation` own grouped workflow state and mutation handlers for dense screens. Avoid moving form fields into Zustand; React Hook Form remains the form state owner.
- **Split pages by workflow**: vehicle detail tabs live under `pages/fleet/components/`, payroll subviews live under `pages/payroll/components/`, report table/export controls live under `pages/reports/components/`, and project task/material/service subcomponents live under `components/projects/`.
- **React Hook Form watchers**: when a watched form value is used in render logic, prefer `useWatch({ control, name })` over direct `watch("field")`.
- **Build note**: route-level code-splitting keeps the app entry under Vite's 500 kB warning line. PDF and XLSX exports are loaded by action-level dynamic imports, with separate `pdf-export` and `xlsx-export` chunks. Visualization vendors are split by purpose (`charts-vendor`, `org-chart-vendor`, `kanban-vendor`). Vite still reports the lazy PDF chunk as large because `@react-pdf/renderer` is heavy.

## Fleet module architecture

The fleet module follows the same pattern as all other modules:

- **5 Prisma models**: `Vehicle`, `VehicleDocument`, `MileageLog`, `VehicleLease`, `VehicleExpense`
- **4 enums**: `FuelType`, `VehicleStatus`, `DocumentType`, `ExpenseType`
- **5 resolver/service pairs**: one per entity, all registered in `FleetModule`
- **Key query**: `expiringDocuments(daysAhead: Int!)` — returns document counts grouped by type where `now ≤ expiryDate ≤ now + daysAhead`
- All child models have `onDelete: Cascade` on the `Vehicle` relation
- `VehicleExpense` carries an optional `projectId` so fuel/repair costs can roll into a project's cost pool

## Stock module — purchase orders & in-transit goods

Beyond the basic warehouse/product/movement layer, the stock module also handles supplier procurement so the warehouse can track "marfă în tranzit" (goods ordered but not yet received), a headline novelty item from the thesis spec.

- **4 Prisma models**: `PurchaseOrder`, `PurchaseOrderLine`, `PurchaseOrderReceipt`, `PurchaseOrderReceiptLine` plus the `PurchaseOrderStatus` enum (`DRAFT → ORDERED → PARTIALLY_RECEIVED → FULLY_RECEIVED`, or `CANCELLED` from any non-terminal state).
- **Numbering**: PO and NIR both use `series + Int @default(autoincrement())` plus a `@@unique([series, number])` pair, mirroring `Invoice`. Display is zero-padded (`PO-000123`, `NIR-000045`) via the `formattedNumber` resolver fields.
- **Receptions write stock**: `recordPurchaseOrderReceipt` runs in a single `prisma.$transaction` that bumps `PurchaseOrderLine.qtyReceived`, upserts `ProductStock.quantity`, refreshes `Product.currentStock`, and writes one `StockMovement { type: IN }` per receipt line (with a `purchaseReceiptLineId` foreign key for traceability). Status then auto-advances to `PARTIALLY_RECEIVED` or `FULLY_RECEIVED`.
- **In-transit visibility is derived**: there is no stored `inTransitQty` column — it's computed on the fly via `purchaseOrderLine.findMany` filtered by `order.status ∈ {ORDERED, PARTIALLY_RECEIVED}` and exposed as resolver fields on `Product.inTransitQty(warehouseId)` / `ProductStock.inTransitQty`. Top-level queries `inTransitSummary(warehouseId)` and `inTransitByProduct(productId, warehouseId)` power the dashboard widget.
- **RBAC**: re-uses the existing `stock: read | write` permission key — no new department mapping needed. Cancel is allowed for `DRAFT`/`ORDERED`/`PARTIALLY_RECEIVED`; delete is only allowed while still `DRAFT` with no receipts; over-receipt is rejected.
- **Frontend**: `apps/web/src/pages/stock/PurchaseOrders*.tsx` (list / create / detail with Overview / Lines / Receptions tabs), `apps/web/src/components/stock/{PurchaseOrderStatusBadge,PurchaseOrderLineEditor,RecordReceptionSheet,InTransitWidget}.tsx`. The Stock overview page embeds the in-transit widget; the Products page adds an "In transit" column wired off `inTransitSummary`.

## Stock module — defective stock (stoc defect)

The thesis spec calls for tracking three real-time stock buckets per (product, warehouse): **available**, **reserved** and **defective**. The defective bucket lets the warehouse pull damaged units out of sellable circulation without losing traceability — they can later be returned to the supplier or scrapped.

- **Schema**: `ProductStock` gained a `defectiveQty Float @default(0)` column alongside the existing `quantity` and `reservedQty`. The `StockMovementType` enum gained two values, `DEFECT` and `SCRAP`, so every transition leaves an audit trail in `StockMovement`.
- **Bucket math (single source of truth)**: `availableQty = quantity − reservedQty − defectiveQty`. The resolver lives in `apps/api/src/stock/product-stock.resolver.ts` and is the only place this formula is computed for the API surface. `Product.currentStock` was redefined as the sellable sum across warehouses: `SUM(quantity − defectiveQty)`. A private helper `recomputeProductCurrentStock(productId, tx)` in `StockService` is reused by every mutation that touches a `ProductStock` row, so low-stock alerts no longer mistake defective units for healthy inventory.
- **Two mutations, two flows**:
  - `markStockDefective(input)` (movement type `DEFECT`) moves units from the healthy bucket into the defective bucket. On-hand `quantity` stays the same; sellable stock drops. Guard: cannot mark more than `quantity − reservedQty − defectiveQty` (healthy-unreserved) in the chosen warehouse.
  - `scrapDefectiveStock(input)` (movement type `SCRAP`) permanently removes units from the defective bucket — decrements both `defectiveQty` and `quantity` by the same amount, then recomputes `Product.currentStock`. Guard: cannot scrap more than the current `defectiveQty`.
- **Knock-on changes in existing flows**: `reserveStock` and `issueStock` now subtract `defectiveQty` when checking availability, so project material reservations and issuances cannot accidentally consume defective units. `createStockMovement` blocks `OUT` movements that would dip into the defective bucket, and rejects `ADJUSTMENT` values below the current `defectiveQty` (forcing the user to scrap defective units explicitly).
- **Notifications**: `markStockDefective` re-uses the existing `maybeEmitLowStock` helper, so demoting units to defective can trigger a `STOCK_BELOW_MINIMUM` notification if it pushes sellable stock under `Product.minimumStock`.
- **RBAC**: both mutations re-use the existing `stock: write` permission key.
- **Frontend**: `apps/web/src/components/stock/DefectiveStockSheet.tsx` — a right-side sheet opened from the Products page row action (`PackageX` icon button). It shows the per-warehouse breakdown (On hand / Reserved / Defective / Available), toggles between "Report defective" and "Scrap defective" modes, validates qty client-side against the respective cap, and refetches the stock overview, low-stock list and products query after a successful mutation. `availableQty` and `defectiveQty` are surfaced in `GET_PRODUCT_STOCK_BY_PRODUCT_QUERY`.

## Projects module architecture

The projects module is a cross-cutting hub that ties Partners, Stock, Fleet, HR, Tasks and Finance together. A project represents a client-delivery job.

- **7 Prisma models**: `Project`, `ProjectMember`, `ProjectMaterial`, `ProjectVehicle`, `ProjectTask`, `ProjectTaskComment`, `ProjectFeedEntry`
- **6 enums**: `ProjectStatus`, `ProjectMemberRole`, `ProjectMaterialStatus`, `ProjectTaskStatus`, `ProjectTaskPriority`, `ProjectFeedKind`
- **7 service/resolver pairs**: `Projects`, `ProjectMembers`, `ProjectMaterials`, `ProjectVehicles`, `ProjectTasks`, `ProjectTaskComments`, `ProjectFeed`
- **Permissions:** new `projects: AccessLevel` key in `permissions.config.ts`. Project-scoped access is enforced via `ProjectAccessGuard` (`member` / `manager` levels) and the `@RequireProjectAccess` decorator.
- **Cross-module touch points:**
  - `Invoice.projectId` — links an invoice to a project. Plus `projectCostsForInvoice(projectId)` query that aggregates issued materials and tagged vehicle expenses into draft invoice line items.
  - `StockMovement.projectId` and `StockMovement.projectMaterialId` — issuance is recorded against the project allocation.
  - `ProductStock.reservedQty` and `ProductStock.defectiveQty` — tracked per warehouse/product; `availableQty = quantity − reservedQty − defectiveQty`.
  - `VehicleExpense.projectId` — see Fleet section.
- **Stock helpers (in `StockService`)** consumed by the materials flow: `reserveStock`, `releaseReservation`, `issueStock`. All three accept an optional Prisma transaction client.
- **File uploads** (manual feed posts): `POST /uploads/project-feed` REST endpoint (multer, image+PDF, 10MB cap). Files stored under `apps/api/uploads/project-feed/` and served via `useStaticAssets` at `/uploads/`.
- **Lifecycle:** `PLANNING → ACTIVE → ON_HOLD ⇄ ACTIVE → COMPLETED | CANCELLED`. `COMPLETED` requires no open material allocations; `CANCELLED` releases all open reservations.
- **Material flow:** `REQUESTED → RESERVED → PARTIALLY_ISSUED → FULLY_ISSUED` (or `CANCELLED` from any pre-issuance state). Reservation is all-or-nothing; issuance can be partial.
- **Tasks UX:** the Tasks tab is a Jira-style kanban built on `@dnd-kit/react` with optimistic Apollo cache writes (no `refetch()` after a drag). Cards open a right-side `Sheet` (`TaskDetailSheet`) with inline-edit title/description/priority/assignee/due date, status select, an activity timeline that merges `ProjectFeedEntry` rows scoped to the task (via `metadata.taskId`) with flat `ProjectTaskComment` rows, and a comment composer (Cmd/Ctrl+Enter to send). Permission gates: project managers / admins / MANAGEMENT can edit all fields and delete the task; the assignee can change status and comment; other members can only comment; comment edit/delete is author-or-admin. Backend additions: `ProjectTaskComment` model (cascade-delete on task removal), `addProjectTaskComment` / `updateProjectTaskComment` / `deleteProjectTaskComment` / `deleteProjectTask` mutations, and a `projectTaskActivity(taskId)` query that filters the project feed by `metadata.taskId`. Frontend code lives under `apps/web/src/components/projects/tasks/`.

## Frontend details

- UI primitives live in `apps/web/src/components/ui` (shadcn/ui: Radix + Tailwind).
- Forms are built with React Hook Form + Zod. Numeric inputs use `valueAsNumber: true`.
- Global state is handled with Zustand (`auth.store.ts`).
- GraphQL documents are being migrated toward `graphql/queries/`, `graphql/mutations/`, and `graphql/fragments/`. Some legacy `*.mutations.ts` files still contain mixed query/mutation documents for compatibility.

### Implemented modules

| Module | Pages | Notes |
|---|---|---|
| **Auth** | Login | JWT, protected routes |
| **HR** | Employees, Leave Requests, Approvals | |
| **Finance** | Overview, Partners, Invoices | |
| **Stock** | Overview (with in-transit widget), Warehouses, Products (with in-transit column + defective-stock sheet), Movements, Purchase Orders (list / create / detail) | Supplier procurement + NIR reception flow; per-warehouse defective bucket with report/scrap actions |
| **Fleet** | Vehicles list, Create, Detail (5 tabs) | Dashboard widget for expiring docs |
| **Projects** | Projects list, Create, Detail (7 tabs: Overview / Team / Materials / Vehicles / Tasks (kanban) / Feed / Invoices) | Dashboard widgets for "My projects" and "Tasks assigned to me"; invoice editor exposes a "Import costs from project" helper |

## Backend details

- Postgres connectivity is configured via `DATABASE_URL` (see `apps/api/prisma.config.ts`).
- Database hosted on Neon (serverless Postgres). Prisma engine set to `binary`.
- All API endpoints are protected with `JwtAuthGuard`.

## Ports and runtime

- API listens on `process.env.PORT` or `3000` (see `apps/api/src/main.ts`).
- Web dev server port is managed by Vite (default 5173).
