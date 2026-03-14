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
| `ReportingModule` | Dashboard metrics (aggregated queries) |

GraphQL and Prisma are fully wired. `schema.gql` is auto-generated at startup.

## Fleet module architecture

The fleet module follows the same pattern as all other modules:

- **5 Prisma models**: `Vehicle`, `VehicleDocument`, `MileageLog`, `VehicleLease`, `VehicleExpense`
- **4 enums**: `FuelType`, `VehicleStatus`, `DocumentType`, `ExpenseType`
- **5 resolver/service pairs**: one per entity, all registered in `FleetModule`
- **Key query**: `expiringDocuments(daysAhead: Int!)` — returns document counts grouped by type where `now ≤ expiryDate ≤ now + daysAhead`
- All child models have `onDelete: Cascade` on the `Vehicle` relation

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

## Backend details

- Postgres connectivity is configured via `DATABASE_URL` (see `apps/api/prisma.config.ts`).
- Database hosted on Neon (serverless Postgres). Prisma engine set to `binary`.
- All API endpoints are protected with `JwtAuthGuard`.

## Ports and runtime

- API listens on `process.env.PORT` or `3000` (see `apps/api/src/main.ts`).
- Web dev server port is managed by Vite (default 5173).
