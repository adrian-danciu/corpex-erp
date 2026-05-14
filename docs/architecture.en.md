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
| `StockModule` | Warehouses, products, stock movements |
| `FleetModule` | Vehicles, documents, mileage logs, leases, expenses |
| `ProjectsModule` | Client-job projects: members, materials (reserve/issue), vehicle assignments, tasks, activity feed, cost rollup |
| `ReportingModule` | Dashboard metrics (aggregated queries) |
| `SettingsModule` | Company-wide settings (singleton row) |

GraphQL and Prisma are fully wired. `schema.gql` is auto-generated at startup.

## Fleet module architecture

The fleet module follows the same pattern as all other modules:

- **5 Prisma models**: `Vehicle`, `VehicleDocument`, `MileageLog`, `VehicleLease`, `VehicleExpense`
- **4 enums**: `FuelType`, `VehicleStatus`, `DocumentType`, `ExpenseType`
- **5 resolver/service pairs**: one per entity, all registered in `FleetModule`
- **Key query**: `expiringDocuments(daysAhead: Int!)` — returns document counts grouped by type where `now ≤ expiryDate ≤ now + daysAhead`
- All child models have `onDelete: Cascade` on the `Vehicle` relation
- `VehicleExpense` carries an optional `projectId` so fuel/repair costs can roll into a project's cost pool

## Projects module architecture

The projects module is a cross-cutting hub that ties Partners, Stock, Fleet, HR, Tasks and Finance together. A project represents a client-delivery job.

- **7 Prisma models**: `Project`, `ProjectMember`, `ProjectMaterial`, `ProjectVehicle`, `ProjectTask`, `ProjectTaskComment`, `ProjectFeedEntry`
- **6 enums**: `ProjectStatus`, `ProjectMemberRole`, `ProjectMaterialStatus`, `ProjectTaskStatus`, `ProjectTaskPriority`, `ProjectFeedKind`
- **7 service/resolver pairs**: `Projects`, `ProjectMembers`, `ProjectMaterials`, `ProjectVehicles`, `ProjectTasks`, `ProjectTaskComments`, `ProjectFeed`
- **Permissions:** new `projects: AccessLevel` key in `permissions.config.ts`. Project-scoped access is enforced via `ProjectAccessGuard` (`member` / `manager` levels) and the `@RequireProjectAccess` decorator.
- **Cross-module touch points:**
  - `Invoice.projectId` — links an invoice to a project. Plus `projectCostsForInvoice(projectId)` query that aggregates issued materials and tagged vehicle expenses into draft invoice line items.
  - `StockMovement.projectId` and `StockMovement.projectMaterialId` — issuance is recorded against the project allocation.
  - `ProductStock.reservedQty` — tracked per warehouse/product; `availableQty = quantity − reservedQty`.
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
- All GraphQL documents (queries + mutations) live in `apps/web/src/graphql/mutations/`.

### Implemented modules

| Module | Pages | Notes |
|---|---|---|
| **Auth** | Login | JWT, protected routes |
| **HR** | Employees, Leave Requests, Approvals | |
| **Finance** | Overview, Partners, Invoices | |
| **Stock** | Overview, Warehouses, Products, Movements | |
| **Fleet** | Vehicles list, Create, Detail (5 tabs) | Dashboard widget for expiring docs |
| **Projects** | Projects list, Create, Detail (7 tabs: Overview / Team / Materials / Vehicles / Tasks (kanban) / Feed / Invoices) | Dashboard widgets for "My projects" and "Tasks assigned to me"; invoice editor exposes a "Import costs from project" helper |

## Backend details

- Postgres connectivity is configured via `DATABASE_URL` (see `apps/api/prisma.config.ts`).
- Database hosted on Neon (serverless Postgres). Prisma engine set to `binary`.
- All API endpoints are protected with `JwtAuthGuard`.

## Ports and runtime

- API listens on `process.env.PORT` or `3000` (see `apps/api/src/main.ts`).
- Web dev server port is managed by Vite (default 5173).
