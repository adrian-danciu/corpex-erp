# Fleet Module — Design Spec
**Date:** 2026-03-14
**Project:** CORPEX ERP
**Author:** Adrian Danciu

---

## Overview

The Fleet module manages the company's vehicle assets. It covers four areas: vehicle registry, document expiry tracking (ITP, RCA, CASCO, Rovinieta), mileage logging, and leasing/expense management. A dashboard widget surfaces expiring documents grouped by type.

Access is granted to all authenticated users. Role-based restrictions will be applied in a future RBAC overhaul.

---

## Data Models

Five new Prisma models and four new enums added to `apps/api/prisma/schema.prisma`.

### Enums

```prisma
enum FuelType      { DIESEL PETROL ELECTRIC HYBRID }
enum VehicleStatus { ACTIVE INACTIVE MAINTENANCE }
enum DocumentType  { ITP RCA CASCO ROVINIETA }
enum ExpenseType   { FUEL REPAIR OTHER }
```

### Models

```prisma
model Vehicle {
  id            String           @id @default(uuid())
  plateNumber   String           @unique
  chassisNumber String           @unique
  brand         String
  model         String
  year          Int
  fuelType      FuelType
  status        VehicleStatus    @default(ACTIVE)
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt
  documents     VehicleDocument[]
  mileageLogs   MileageLog[]
  leases        VehicleLease[]
  expenses      VehicleExpense[]
}

model VehicleDocument {
  id         String       @id @default(uuid())
  vehicleId  String
  vehicle    Vehicle      @relation(fields: [vehicleId], references: [id])
  type       DocumentType
  expiryDate DateTime
  issuedDate DateTime?
  provider   String?
  createdAt  DateTime     @default(now())
  updatedAt  DateTime     @updatedAt
}

model MileageLog {
  id        String   @id @default(uuid())
  vehicleId String
  vehicle   Vehicle  @relation(fields: [vehicleId], references: [id])
  date      DateTime
  odometer  Int
  notes     String?
  createdAt DateTime @default(now())
}

model VehicleLease {
  id          String   @id @default(uuid())
  vehicleId   String
  vehicle     Vehicle  @relation(fields: [vehicleId], references: [id])
  provider    String
  startDate   DateTime
  endDate     DateTime
  monthlyRate Float
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model VehicleExpense {
  id          String      @id @default(uuid())
  vehicleId   String
  vehicle     Vehicle     @relation(fields: [vehicleId], references: [id])
  type        ExpenseType
  amount      Float
  date        DateTime
  description String?
  createdAt   DateTime    @default(now())
}
```

**Note on immutable log entries:** `MileageLog` and `VehicleExpense` are intentionally append-only (no `updatedAt`, no update mutations). If an entry is incorrect it should be deleted and re-created. This matches standard accounting/logbook practice.

---

## API Structure

Location: `apps/api/src/fleet/`

Follows the finance module pattern: one NestJS module, separate resolver/service pairs per entity.

```
fleet/
├── fleet.module.ts
├── vehicles.resolver.ts
├── vehicles.service.ts
├── vehicle-documents.resolver.ts
├── vehicle-documents.service.ts
├── mileage.resolver.ts
├── mileage.service.ts
├── leases.resolver.ts
├── leases.service.ts
├── expenses.resolver.ts
├── expenses.service.ts
├── entities/
│   ├── vehicle.entity.ts
│   ├── vehicle-document.entity.ts
│   ├── mileage-log.entity.ts
│   ├── vehicle-lease.entity.ts
│   ├── vehicle-expense.entity.ts
│   └── expiring-document-summary.type.ts
└── dto/
    ├── create-vehicle.input.ts
    ├── update-vehicle.input.ts
    ├── paginated-vehicle.dto.ts
    ├── create-vehicle-document.input.ts
    ├── update-vehicle-document.input.ts
    ├── create-mileage-log.input.ts
    ├── create-vehicle-lease.input.ts
    ├── update-vehicle-lease.input.ts
    └── create-vehicle-expense.input.ts
```

### GraphQL Operations

| Operation | Type | Description |
|-----------|------|-------------|
| `vehicles(pagination)` | Query | Paginated vehicle list |
| `vehicle(id)` | Query | Single vehicle with all relations fully loaded (non-paginated) |
| `createVehicle(input)` | Mutation | Create vehicle |
| `updateVehicle(id, input)` | Mutation | Update vehicle fields and status |
| `deleteVehicle(id)` | Mutation | Delete vehicle |
| `vehicleDocuments(vehicleId)` | Query | All documents for a vehicle |
| `createVehicleDocument(input)` | Mutation | Add document |
| `updateVehicleDocument(id, input)` | Mutation | Update document (e.g. correct expiry date) |
| `deleteVehicleDocument(id)` | Mutation | Remove document |
| `mileageLogs(vehicleId)` | Query | Mileage history ordered by date desc |
| `createMileageLog(input)` | Mutation | Add odometer entry |
| `deleteMileageLog(id)` | Mutation | Remove incorrect entry |
| `vehicleLeases(vehicleId)` | Query | Lease contracts ordered by startDate desc |
| `createVehicleLease(input)` | Mutation | Add lease |
| `updateVehicleLease(id, input)` | Mutation | Update lease |
| `deleteVehicleLease(id)` | Mutation | Remove lease |
| `vehicleExpenses(vehicleId)` | Query | Expenses ordered by date desc |
| `createVehicleExpense(input)` | Mutation | Add expense |
| `deleteVehicleExpense(id)` | Mutation | Remove incorrect entry |
| `expiringDocuments(daysAhead: Int!)` | Query | Dashboard — document counts grouped by type expiring within N days |

All resolvers use `@UseGuards(JwtAuthGuard)`. No role restrictions at this stage.

### `expiringDocuments` Query

Returns `ExpiringDocumentSummary[]`:

```ts
@ObjectType()
class ExpiringDocumentSummary {
  @Field(() => DocumentType)
  type: DocumentType;

  @Field()
  count: number;
}
```

Prisma filter: `expiryDate >= now AND expiryDate <= now + daysAhead days`. This ensures already-expired documents are excluded — only documents expiring in the future within the window are counted. The dashboard widget calls this with `daysAhead: 30`. Each row links to `/fleet` (unfiltered list). Per-type filtering is out of scope for this iteration.

### `vehicle(id)` Query

Loads the vehicle with all relations fully included (`documents`, `mileageLogs`, `leases`, `expenses`). These collections are not paginated on the detail page — volumes are expected to be small per vehicle.

### Module Registration

`FleetModule` is imported into `AppModule` in `apps/api/src/app.module.ts`.

---

## Frontend Structure

```
apps/web/src/
├── pages/fleet/
│   ├── VehiclesPage.tsx
│   ├── VehicleCreatePage.tsx
│   └── VehicleDetailPage.tsx
├── components/fleet/
│   ├── VehicleStatusBadge.tsx
│   └── DocumentTypeBadge.tsx
├── components/dashboard/
│   └── FleetExpiryWidget.tsx
├── graphql/
│   ├── queries/fleet.queries.ts
│   └── mutations/fleet.mutations.ts
├── lib/schemas/
│   └── fleet.schema.ts
└── types/
    └── fleet.types.ts
```

### Pages

**`VehiclesPage`**
- Paginated table: plate number, brand/model, year, fuel type, `VehicleStatusBadge`, link to detail
- "Add Vehicle" button → `/fleet/create`
- Matches `EmployeesPage` structure

**`VehicleCreatePage`**
- Form fields: plate number, chassis number, brand, model, year, fuel type
- On success: redirect to `/fleet`
- Matches `ProductCreatePage` structure

**`VehicleDetailPage`**
- 5 tabs using shadcn `Tabs` component:

| Tab | Content |
|-----|---------|
| Overview | Vehicle fields (brand, model, plate, chassis, year, fuel type) + `VehicleStatusBadge` + inline edit via `updateVehicle` mutation |
| Documents | Table with `DocumentTypeBadge`, expiry date, issued date, provider. Add (form), edit expiry/provider, delete. |
| Mileage | Chronological odometer readings (date, km, notes). Add new entry. Delete incorrect entry. No edit (append-only). |
| Lease | Lease contracts (provider, start/end dates, monthly rate, notes). Add and update lease. Delete lease. |
| Expenses | Expenses table (type, amount, date, description) with running total. Add expense. Delete incorrect entry. No edit (append-only). |

### Badge Color Conventions

**`VehicleStatusBadge`:**
- `ACTIVE` → green
- `MAINTENANCE` → yellow
- `INACTIVE` → gray

**`DocumentTypeBadge`:**
- Neutral color (blue/gray) — decorative label only, not status-driven

### Routing

Added to `apps/web/src/App.tsx`:

```
/fleet          → VehiclesPage
/fleet/create   → VehicleCreatePage
/fleet/:id      → VehicleDetailPage
```

### Sidebar

New "Fleet" entry added to `apps/web/src/components/layout/Sidebar.tsx` using `Car` icon from `lucide-react`.

### Dashboard Widget

**`FleetExpiryWidget`** added to `DashboardPage.tsx`:
- Calls `expiringDocuments(daysAhead: 30)` query
- Shows only document types with `count > 0`
- If all counts are 0: displays "All documents up to date"
- Each row is a link to `/fleet` (unfiltered)

### Forms & Validation

All forms use React Hook Form + Zod. Schemas defined in `fleet.schema.ts`:
- `createVehicleSchema` — plateNumber, chassisNumber, brand, model, year, fuelType
- `updateVehicleSchema` — all fields optional except id
- `createVehicleDocumentSchema` — vehicleId, type, expiryDate, issuedDate?, provider?
- `updateVehicleDocumentSchema` — expiryDate?, issuedDate?, provider?
- `createMileageLogSchema` — vehicleId, date, odometer, notes?
- `createVehicleLeaseSchema` — vehicleId, provider, startDate, endDate, monthlyRate, notes?
- `updateVehicleLeaseSchema` — all fields optional except id
- `createVehicleExpenseSchema` — vehicleId, type, amount, date, description?

---

## Code Standards

- No inline comments
- DRY: shared pagination pattern reused from `common/dto/pagination.input.ts`
- Clean module boundaries: fleet logic stays within `fleet/` folder
- shadcn/ui components only (no custom CSS)
- Consistent with existing module patterns (finance, employees, stock)

---

## Out of Scope (Future)

- Role-based access control per fleet operation
- Pre-filtering vehicle list by expiring document type from dashboard widget click
- Push/email notifications for expiring documents
- PDF export of fleet reports
