# Project Structure (English)

## High-level layout
```
corpex-erp/
  apps/
    api/       # NestJS backend
    web/       # React frontend (Vite)
  docs/        # Project docs (EN + RO)
  package.json # Minimal root package (no scripts)
```

## apps/web (frontend)
 - `src/`: React UI code.
   - `components/`: Shared components and UI primitives.
     - `ui/`: shadcn/ui primitives (Radix + Tailwind), including tooltip and checkbox.
     - `common/`: Shared components (Pagination, etc.).
     - `fleet/`: Fleet-specific components (VehicleStatusBadge, DocumentTypeBadge).
     - `projects/`: Project status badge, plus tab components under `projects/tabs/` (OverviewTab, TeamTab, MaterialsTab, VehiclesTab, TasksTab, FeedTab, InvoicesTab).
     - `dashboard/`: Dashboard widgets (FleetExpiryWidget, MyProjectsWidget, MyTasksWidget, etc.).
   - `pages/`: Page components organized by module.
     - `hr/`: Employees, Leave Requests, Approvals, Employee Detail.
     - `finance/`: Overview, Partners, Invoices (Invoice editor includes a Project picker + cost-import helper).
     - `stock/`: Warehouses, Products, Stock Movements.
     - `fleet/`: Vehicles list, create, and detail pages (Expense form includes a Project picker with smart default).
     - `projects/`: Projects list, create, and detail (tabbed) pages.
     - `payroll/`: Payroll generation/detail page.
     - `DocumentsPage.tsx`: Employee document storage overview.
     - `ReportsPage.tsx`: Reports with PDF/Excel export actions.
   - `graphql/mutations/`: Apollo `gql` mutation documents, plus legacy mixed query/mutation files that have not been migrated yet.
   - `graphql/queries/`: Apollo query documents for migrated modules (fleet first).
   - `graphql/fragments/`: Shared GraphQL fragments for repeated selections (fleet, finance, employee, project task).
   - `types/`: TypeScript interfaces and enums per module.
   - `lib/schemas/`: Zod validation schemas per module.
   - `stores/`: Global state stores (Zustand).
 - `vite.config.ts`: Vite build config.

## apps/api (backend)
 - `src/`: NestJS application.
   - `auth/`: Authentication module (JWT, Passport).
   - `users/`: User management.
   - `employees/`: HR module (Employees, Employee Documents, Leave Requests).
   - `finance/`: Finance module (Partners, Invoices, Payments).
   - `stock/`: Stock module (Warehouses, Products, Stock Movements, Purchase Orders).
     - `stock.service.ts`: Public stock facade for catalog reads/writes and stock helper methods consumed by other modules.
     - `stock-ledger.service.ts`: Stock movement, reservation, issue, defective, and scrap transaction logic.
     - `purchase-orders.service.ts`: Public purchase-order facade for CRUD, status transitions, and in-transit queries.
     - `purchase-order-receiving.service.ts`: Receipt transaction logic, including stock increments, movements, and purchase-order status updates.
   - `fleet/`: Fleet module (Vehicles, Documents, Mileage, Leases, Expenses).
     - `entities/`: GraphQL ObjectTypes for all fleet models.
     - `dto/`: Input types for all fleet mutations.
     - `vehicles.service.ts` / `vehicles.resolver.ts`: Vehicle CRUD + pagination.
     - `vehicle-documents.service.ts` / `vehicle-documents.resolver.ts`: Document CRUD + expiry query.
     - `mileage.service.ts` / `mileage.resolver.ts`: Mileage log append + delete.
     - `leases.service.ts` / `leases.resolver.ts`: Lease contract CRUD.
     - `expenses.service.ts` / `expenses.resolver.ts`: Expense append + delete (accepts optional `projectId` so costs roll into a project).
   - `projects/`: Projects module (Projects, Members, Materials, Vehicles, Tasks, Feed).
     - `entities/`: GraphQL ObjectTypes for all project models + `ProjectCostRollup` computed type.
     - `dto/`: Input types for every mutation (create/update project, status transition, member add/role/remove, material request/reserve/issue/cancel, vehicle assign/end, task create/update/transition, feed post).
     - `decorators/project-access.decorator.ts` + `guards/project-access.guard.ts`: project-scoped RBAC (`member` / `manager` levels). Auto-resolves project context from `taskId`, `projectMaterialId`, `assignmentId`, `feedEntryId`, or `memberId` if `projectId` isn't passed directly.
     - `projects.service.ts` / `projects.resolver.ts`: Project CRUD, lifecycle transitions, cost rollup query.
     - `project-members.service.ts` / `project-members.resolver.ts`: Membership management.
     - `project-materials.service.ts` / `project-materials.resolver.ts`: Reserve / issue / cancel flow; calls `StockService` helpers in transactions.
     - `project-vehicles.service.ts` / `project-vehicles.resolver.ts`: Time-bounded assignments with auto-end-previous; `currentProjectForVehicle` query for the smart default.
     - `project-tasks.service.ts` / `project-tasks.resolver.ts`: Task CRUD + kanban transitions; `myProjectTasks` query.
     - `project-feed.service.ts` / `project-feed.resolver.ts`: Combined feed (auto + manual). `recordAutoEntry` is consumed by every other project sub-service.
     - `project-uploads.controller.ts`: REST endpoint `POST /uploads/project-feed` for feed attachments (multer, image+PDF, 10MB cap).
   - `common/`: Shared DTOs and helpers (`PaginationInput`, Paginated factory, pagination normalization/result helpers).
   - `reporting/`: Dashboard metrics module.
   - `settings/`: Company settings (singleton).
   - `payroll/`: Payroll periods, payroll lines, Romanian tax calculation, draft delete/approve/paid lifecycle.
 - `src/schema.gql`: Auto-generated GraphQL schema.
 - `prisma/schema.prisma`: Prisma schema (User, Employee, EmployeeDocument, PayrollPeriod, PayrollLine, Partner, Invoice, Vehicle, VehicleDocument, MileageLog, VehicleLease, VehicleExpense, Project, ProjectMember, ProjectMaterial, ProjectVehicle, ProjectTask, ProjectFeedEntry, etc.). `Invoice`, `StockMovement`, and `VehicleExpense` carry an optional `projectId`. `ProductStock` carries `reservedQty`.
 - `prisma.config.ts`: Prisma config with `DATABASE_URL`.
 - `uploads/` (gitignored): runtime storage for feed attachments. Served at `/uploads/` via `useStaticAssets`.

## How parts fit together
- `apps/web` uses Apollo Client + GraphQL to call the API.
- `apps/api` hosts a GraphQL endpoint (NestJS + Apollo Server).
- `apps/api` uses Prisma + Postgres (Neon serverless) to persist data.
- All modules follow the same pattern: `entities/` → `dto/` → `service` → `resolver` → registered in the module → imported in `AppModule`.
- Employee salary is required and represents gross monthly EUR salary. `Employee.isContractor` marks B2B contractors, which payroll treats without employee taxes or CAM.
