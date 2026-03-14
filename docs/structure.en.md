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
     - `ui/`: shadcn/ui primitives (Radix + Tailwind).
     - `common/`: Shared components (Pagination, etc.).
     - `fleet/`: Fleet-specific components (VehicleStatusBadge, DocumentTypeBadge).
     - `dashboard/`: Dashboard widgets (FleetExpiryWidget, etc.).
   - `pages/`: Page components organized by module.
     - `hr/`: Employees, Leave Requests, Approvals.
     - `finance/`: Overview, Partners, Invoices.
     - `stock/`: Warehouses, Products, Stock Movements.
     - `fleet/`: Vehicles list, create, and detail pages.
   - `graphql/mutations/`: Apollo `gql` query and mutation documents (all modules).
   - `types/`: TypeScript interfaces and enums per module.
   - `lib/schemas/`: Zod validation schemas per module.
   - `stores/`: Global state stores (Zustand).
 - `vite.config.ts`: Vite build config.

## apps/api (backend)
 - `src/`: NestJS application.
   - `auth/`: Authentication module (JWT, Passport).
   - `users/`: User management.
   - `employees/`: HR module (Employees, Leave Requests).
   - `finance/`: Finance module (Partners, Invoices, Payments).
   - `stock/`: Stock module (Warehouses, Products, Stock Movements).
   - `fleet/`: Fleet module (Vehicles, Documents, Mileage, Leases, Expenses).
     - `entities/`: GraphQL ObjectTypes for all fleet models.
     - `dto/`: Input types for all fleet mutations.
     - `vehicles.service.ts` / `vehicles.resolver.ts`: Vehicle CRUD + pagination.
     - `vehicle-documents.service.ts` / `vehicle-documents.resolver.ts`: Document CRUD + expiry query.
     - `mileage.service.ts` / `mileage.resolver.ts`: Mileage log append + delete.
     - `leases.service.ts` / `leases.resolver.ts`: Lease contract CRUD.
     - `expenses.service.ts` / `expenses.resolver.ts`: Expense append + delete.
   - `common/`: Shared DTOs (PaginationInput, Paginated factory).
   - `reporting/`: Dashboard metrics module.
 - `src/schema.gql`: Auto-generated GraphQL schema.
 - `prisma/schema.prisma`: Prisma schema (User, Employee, Partner, Invoice, Vehicle, VehicleDocument, MileageLog, VehicleLease, VehicleExpense, etc.).
 - `prisma.config.ts`: Prisma config with `DATABASE_URL`.

## How parts fit together
- `apps/web` uses Apollo Client + GraphQL to call the API.
- `apps/api` hosts a GraphQL endpoint (NestJS + Apollo Server).
- `apps/api` uses Prisma + Postgres (Neon serverless) to persist data.
- All modules follow the same pattern: `entities/` → `dto/` → `service` → `resolver` → registered in the module → imported in `AppModule`.
