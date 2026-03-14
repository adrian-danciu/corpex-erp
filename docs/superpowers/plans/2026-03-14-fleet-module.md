# Fleet Module Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a full Fleet management module (vehicles, documents, mileage, leases, expenses) across NestJS/GraphQL backend and React frontend, including a dashboard expiry widget.

**Architecture:** Single `fleet` NestJS module following the `finance` module pattern — separate resolver/service pairs per entity, one module file. Frontend follows the `employees` list/create/detail page pattern with shadcn/ui components.

**Tech Stack:** NestJS + GraphQL (code-first) + Prisma + PostgreSQL | React + Apollo Client + React Hook Form + Zod + shadcn/ui

**Spec:** `docs/superpowers/specs/2026-03-14-fleet-module-design.md`

---

## File Map

### Backend — Create
- `apps/api/src/fleet/fleet.module.ts`
- `apps/api/src/fleet/entities/vehicle.entity.ts`
- `apps/api/src/fleet/entities/vehicle-document.entity.ts`
- `apps/api/src/fleet/entities/mileage-log.entity.ts`
- `apps/api/src/fleet/entities/vehicle-lease.entity.ts`
- `apps/api/src/fleet/entities/vehicle-expense.entity.ts`
- `apps/api/src/fleet/entities/expiring-document-summary.type.ts`
- `apps/api/src/fleet/dto/create-vehicle.input.ts`
- `apps/api/src/fleet/dto/update-vehicle.input.ts`
- `apps/api/src/fleet/dto/paginated-vehicle.dto.ts`
- `apps/api/src/fleet/dto/create-vehicle-document.input.ts`
- `apps/api/src/fleet/dto/update-vehicle-document.input.ts`
- `apps/api/src/fleet/dto/create-mileage-log.input.ts`
- `apps/api/src/fleet/dto/create-vehicle-lease.input.ts`
- `apps/api/src/fleet/dto/update-vehicle-lease.input.ts`
- `apps/api/src/fleet/dto/create-vehicle-expense.input.ts`
- `apps/api/src/fleet/vehicles.service.ts`
- `apps/api/src/fleet/vehicles.resolver.ts`
- `apps/api/src/fleet/vehicle-documents.service.ts`
- `apps/api/src/fleet/vehicle-documents.resolver.ts`
- `apps/api/src/fleet/mileage.service.ts`
- `apps/api/src/fleet/mileage.resolver.ts`
- `apps/api/src/fleet/leases.service.ts`
- `apps/api/src/fleet/leases.resolver.ts`
- `apps/api/src/fleet/expenses.service.ts`
- `apps/api/src/fleet/expenses.resolver.ts`

### Backend — Modify
- `apps/api/prisma/schema.prisma` — add 4 enums + 5 models
- `apps/api/src/app.module.ts` — register FleetModule

### Frontend — Create
- `apps/web/src/types/fleet.types.ts`
- `apps/web/src/graphql/mutations/fleet.queries.ts`
- `apps/web/src/graphql/mutations/fleet.mutations.ts`
- `apps/web/src/lib/schemas/fleet.schema.ts`
- `apps/web/src/components/fleet/VehicleStatusBadge.tsx`
- `apps/web/src/components/fleet/DocumentTypeBadge.tsx`
- `apps/web/src/components/dashboard/FleetExpiryWidget.tsx`
- `apps/web/src/pages/fleet/VehiclesPage.tsx`
- `apps/web/src/pages/fleet/VehicleCreatePage.tsx`
- `apps/web/src/pages/fleet/VehicleDetailPage.tsx`

### Frontend — Modify
- `apps/web/src/pages/DashboardPage.tsx` — add FleetExpiryWidget
- `apps/web/src/App.tsx` — add fleet routes
- `apps/web/src/components/layout/Sidebar.tsx` — add Fleet menu entry

---

## Chunk 1: Backend — Schema, Entities & DTOs

### Task 1: Update Prisma Schema

**Files:**
- Modify: `apps/api/prisma/schema.prisma`

- [ ] **Step 1: Add enums and models to schema**

Append to the end of `apps/api/prisma/schema.prisma`:

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
  vehicle    Vehicle      @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
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
  vehicle   Vehicle  @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
  date      DateTime
  odometer  Int
  notes     String?
  createdAt DateTime @default(now())
}

model VehicleLease {
  id          String   @id @default(uuid())
  vehicleId   String
  vehicle     Vehicle  @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
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
  vehicle     Vehicle     @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
  type        ExpenseType
  amount      Float
  date        DateTime
  description String?
  createdAt   DateTime    @default(now())
}

enum FuelType {
  DIESEL
  PETROL
  ELECTRIC
  HYBRID
}

enum VehicleStatus {
  ACTIVE
  INACTIVE
  MAINTENANCE
}

enum DocumentType {
  ITP
  RCA
  CASCO
  ROVINIETA
}

enum ExpenseType {
  FUEL
  REPAIR
  OTHER
}
```

- [ ] **Step 2: Run migration**

```bash
cd apps/api && bunx prisma migrate dev --name add_fleet_module
```

Expected: Migration created and applied, Prisma client regenerated.

- [ ] **Step 3: Verify types are available**

```bash
cd apps/api && bunx prisma generate
```

- [ ] **Step 4: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations
git commit -m "feat(fleet): add fleet module prisma schema and migration"
```

---

### Task 2: Fleet Entities

**Files:**
- Create: `apps/api/src/fleet/entities/vehicle.entity.ts`
- Create: `apps/api/src/fleet/entities/vehicle-document.entity.ts`
- Create: `apps/api/src/fleet/entities/mileage-log.entity.ts`
- Create: `apps/api/src/fleet/entities/vehicle-lease.entity.ts`
- Create: `apps/api/src/fleet/entities/vehicle-expense.entity.ts`
- Create: `apps/api/src/fleet/entities/expiring-document-summary.type.ts`

- [ ] **Step 1: Create vehicle.entity.ts**

```ts
import { ObjectType, Field, ID, Int, registerEnumType } from '@nestjs/graphql';
import { FuelType, VehicleStatus } from '@prisma/client';
import { VehicleDocument } from './vehicle-document.entity';
import { MileageLog } from './mileage-log.entity';
import { VehicleLease } from './vehicle-lease.entity';
import { VehicleExpense } from './vehicle-expense.entity';

registerEnumType(FuelType, { name: 'FuelType' });
registerEnumType(VehicleStatus, { name: 'VehicleStatus' });

@ObjectType()
export class Vehicle {
  @Field(() => ID)
  id: string;

  @Field()
  plateNumber: string;

  @Field()
  chassisNumber: string;

  @Field()
  brand: string;

  @Field()
  model: string;

  @Field(() => Int)
  year: number;

  @Field(() => FuelType)
  fuelType: FuelType;

  @Field(() => VehicleStatus)
  status: VehicleStatus;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => [VehicleDocument], { nullable: true })
  documents?: VehicleDocument[];

  @Field(() => [MileageLog], { nullable: true })
  mileageLogs?: MileageLog[];

  @Field(() => [VehicleLease], { nullable: true })
  leases?: VehicleLease[];

  @Field(() => [VehicleExpense], { nullable: true })
  expenses?: VehicleExpense[];
}
```

- [ ] **Step 2: Create vehicle-document.entity.ts**

```ts
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { DocumentType } from '@prisma/client';

registerEnumType(DocumentType, { name: 'DocumentType' });

@ObjectType()
export class VehicleDocument {
  @Field(() => ID)
  id: string;

  @Field()
  vehicleId: string;

  @Field(() => DocumentType)
  type: DocumentType;

  @Field(() => Date)
  expiryDate: Date;

  @Field(() => Date, { nullable: true })
  issuedDate?: Date | null;

  @Field(() => String, { nullable: true })
  provider?: string | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
```

- [ ] **Step 3: Create mileage-log.entity.ts**

```ts
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class MileageLog {
  @Field(() => ID)
  id: string;

  @Field()
  vehicleId: string;

  @Field(() => Date)
  date: Date;

  @Field(() => Int)
  odometer: number;

  @Field(() => String, { nullable: true })
  notes?: string | null;

  @Field(() => Date)
  createdAt: Date;
}
```

- [ ] **Step 4: Create vehicle-lease.entity.ts**

```ts
import { ObjectType, Field, ID, Float } from '@nestjs/graphql';

@ObjectType()
export class VehicleLease {
  @Field(() => ID)
  id: string;

  @Field()
  vehicleId: string;

  @Field()
  provider: string;

  @Field(() => Date)
  startDate: Date;

  @Field(() => Date)
  endDate: Date;

  @Field(() => Float)
  monthlyRate: number;

  @Field(() => String, { nullable: true })
  notes?: string | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
```

- [ ] **Step 5: Create vehicle-expense.entity.ts**

```ts
import { ObjectType, Field, ID, Float, registerEnumType } from '@nestjs/graphql';
import { ExpenseType } from '@prisma/client';

registerEnumType(ExpenseType, { name: 'ExpenseType' });

@ObjectType()
export class VehicleExpense {
  @Field(() => ID)
  id: string;

  @Field()
  vehicleId: string;

  @Field(() => ExpenseType)
  type: ExpenseType;

  @Field(() => Float)
  amount: number;

  @Field(() => Date)
  date: Date;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => Date)
  createdAt: Date;
}
```

- [ ] **Step 6: Create expiring-document-summary.type.ts**

```ts
import { ObjectType, Field, Int } from '@nestjs/graphql';
import { DocumentType } from '@prisma/client';

@ObjectType()
export class ExpiringDocumentSummary {
  @Field(() => DocumentType)
  type: DocumentType;

  @Field(() => Int)
  count: number;
}
```

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/fleet/entities/
git commit -m "feat(fleet): add fleet GraphQL entities"
```

---

### Task 3: Fleet DTOs

**Files:**
- Create: `apps/api/src/fleet/dto/create-vehicle.input.ts`
- Create: `apps/api/src/fleet/dto/update-vehicle.input.ts`
- Create: `apps/api/src/fleet/dto/paginated-vehicle.dto.ts`
- Create: `apps/api/src/fleet/dto/create-vehicle-document.input.ts`
- Create: `apps/api/src/fleet/dto/update-vehicle-document.input.ts`
- Create: `apps/api/src/fleet/dto/create-mileage-log.input.ts`
- Create: `apps/api/src/fleet/dto/create-vehicle-lease.input.ts`
- Create: `apps/api/src/fleet/dto/update-vehicle-lease.input.ts`
- Create: `apps/api/src/fleet/dto/create-vehicle-expense.input.ts`

- [ ] **Step 1: Create create-vehicle.input.ts**

```ts
import { InputType, Field, Int } from '@nestjs/graphql';
import { FuelType } from '@prisma/client';

@InputType()
export class CreateVehicleInput {
  @Field()
  plateNumber: string;

  @Field()
  chassisNumber: string;

  @Field()
  brand: string;

  @Field()
  model: string;

  @Field(() => Int)
  year: number;

  @Field(() => FuelType)
  fuelType: FuelType;
}
```

- [ ] **Step 2: Create update-vehicle.input.ts**

```ts
import { InputType, Field, Int } from '@nestjs/graphql';
import { FuelType, VehicleStatus } from '@prisma/client';

@InputType()
export class UpdateVehicleInput {
  @Field()
  id: string;

  @Field({ nullable: true })
  plateNumber?: string;

  @Field({ nullable: true })
  chassisNumber?: string;

  @Field({ nullable: true })
  brand?: string;

  @Field({ nullable: true })
  model?: string;

  @Field(() => Int, { nullable: true })
  year?: number;

  @Field(() => FuelType, { nullable: true })
  fuelType?: FuelType;

  @Field(() => VehicleStatus, { nullable: true })
  status?: VehicleStatus;
}
```

- [ ] **Step 3: Create paginated-vehicle.dto.ts**

```ts
import { ObjectType } from '@nestjs/graphql';
import { Paginated } from '../../common/dto/pagination-result.dto';
import { Vehicle } from '../entities/vehicle.entity';

@ObjectType()
export class PaginatedVehicle extends Paginated(Vehicle) {}
```

- [ ] **Step 4: Create create-vehicle-document.input.ts**

```ts
import { InputType, Field } from '@nestjs/graphql';
import { DocumentType } from '@prisma/client';

@InputType()
export class CreateVehicleDocumentInput {
  @Field()
  vehicleId: string;

  @Field(() => DocumentType)
  type: DocumentType;

  @Field(() => Date)
  expiryDate: Date;

  @Field(() => Date, { nullable: true })
  issuedDate?: Date;

  @Field({ nullable: true })
  provider?: string;
}
```

- [ ] **Step 5: Create update-vehicle-document.input.ts**

```ts
import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class UpdateVehicleDocumentInput {
  @Field()
  id: string;

  @Field(() => Date, { nullable: true })
  expiryDate?: Date;

  @Field(() => Date, { nullable: true })
  issuedDate?: Date;

  @Field({ nullable: true })
  provider?: string;
}
```

- [ ] **Step 6: Create create-mileage-log.input.ts**

```ts
import { InputType, Field, Int } from '@nestjs/graphql';

@InputType()
export class CreateMileageLogInput {
  @Field()
  vehicleId: string;

  @Field(() => Date)
  date: Date;

  @Field(() => Int)
  odometer: number;

  @Field({ nullable: true })
  notes?: string;
}
```

- [ ] **Step 7: Create create-vehicle-lease.input.ts**

```ts
import { InputType, Field, Float } from '@nestjs/graphql';

@InputType()
export class CreateVehicleLeaseInput {
  @Field()
  vehicleId: string;

  @Field()
  provider: string;

  @Field(() => Date)
  startDate: Date;

  @Field(() => Date)
  endDate: Date;

  @Field(() => Float)
  monthlyRate: number;

  @Field({ nullable: true })
  notes?: string;
}
```

- [ ] **Step 8: Create update-vehicle-lease.input.ts**

```ts
import { InputType, Field, Float } from '@nestjs/graphql';

@InputType()
export class UpdateVehicleLeaseInput {
  @Field()
  id: string;

  @Field({ nullable: true })
  provider?: string;

  @Field(() => Date, { nullable: true })
  startDate?: Date;

  @Field(() => Date, { nullable: true })
  endDate?: Date;

  @Field(() => Float, { nullable: true })
  monthlyRate?: number;

  @Field({ nullable: true })
  notes?: string;
}
```

- [ ] **Step 9: Create create-vehicle-expense.input.ts**

```ts
import { InputType, Field, Float } from '@nestjs/graphql';
import { ExpenseType } from '@prisma/client';

@InputType()
export class CreateVehicleExpenseInput {
  @Field()
  vehicleId: string;

  @Field(() => ExpenseType)
  type: ExpenseType;

  @Field(() => Float)
  amount: number;

  @Field(() => Date)
  date: Date;

  @Field({ nullable: true })
  description?: string;
}
```

- [ ] **Step 10: Typecheck backend**

```bash
cd apps/api && bun run typecheck
```

Expected: No errors.

- [ ] **Step 11: Commit**

```bash
git add apps/api/src/fleet/dto/
git commit -m "feat(fleet): add fleet DTOs"
```

---

## Chunk 2: Backend — Services, Resolvers & Module

### Task 4: Vehicles Service & Resolver

**Files:**
- Create: `apps/api/src/fleet/vehicles.service.ts`
- Create: `apps/api/src/fleet/vehicles.resolver.ts`

- [ ] **Step 1: Create vehicles.service.ts**

```ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleInput } from './dto/create-vehicle.input';
import { UpdateVehicleInput } from './dto/update-vehicle.input';
import { PaginationInput } from '../common/dto/pagination.input';
import { IPaginatedType } from '../common/dto/pagination-result.dto';
import { Vehicle } from './entities/vehicle.entity';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  async create(input: CreateVehicleInput): Promise<Vehicle> {
    const existing = await this.prisma.vehicle.findFirst({
      where: {
        OR: [
          { plateNumber: input.plateNumber },
          { chassisNumber: input.chassisNumber },
        ],
      },
    });

    if (existing) {
      throw new ConflictException('A vehicle with this plate number or chassis number already exists');
    }

    return this.prisma.vehicle.create({ data: input });
  }

  async findAll(pagination: PaginationInput): Promise<IPaginatedType<Vehicle>> {
    const { skip, take } = pagination;
    const [items, total] = await Promise.all([
      this.prisma.vehicle.findMany({ skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.vehicle.count(),
    ]);

    return { items, meta: { total, skip, take } };
  }

  async findOne(id: string): Promise<Vehicle | null> {
    return this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        documents: { orderBy: { expiryDate: 'asc' } },
        mileageLogs: { orderBy: { date: 'desc' } },
        leases: { orderBy: { startDate: 'desc' } },
        expenses: { orderBy: { date: 'desc' } },
      },
    });
  }

  async update(input: UpdateVehicleInput): Promise<Vehicle> {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: input.id } });
    if (!vehicle) throw new NotFoundException(`Vehicle with ID ${input.id} not found`);

    const { id, ...data } = input;
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined),
    );

    return this.prisma.vehicle.update({ where: { id }, data: cleanData });
  }

  async remove(id: string): Promise<Vehicle> {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw new NotFoundException(`Vehicle with ID ${id} not found`);
    return this.prisma.vehicle.delete({ where: { id } });
  }
}
```

- [ ] **Step 2: Create vehicles.resolver.ts**

```ts
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { Vehicle } from './entities/vehicle.entity';
import { CreateVehicleInput } from './dto/create-vehicle.input';
import { UpdateVehicleInput } from './dto/update-vehicle.input';
import { PaginatedVehicle } from './dto/paginated-vehicle.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginationInput } from '../common/dto/pagination.input';

@Resolver(() => Vehicle)
export class VehiclesResolver {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Query(() => PaginatedVehicle, { name: 'vehicles' })
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Args('pagination', { nullable: true, type: () => PaginationInput })
    pagination?: PaginationInput,
  ): Promise<PaginatedVehicle> {
    return this.vehiclesService.findAll(pagination ?? { skip: 0, take: 10 });
  }

  @Query(() => Vehicle, { name: 'vehicle', nullable: true })
  @UseGuards(JwtAuthGuard)
  async findOne(@Args('id') id: string): Promise<Vehicle | null> {
    return this.vehiclesService.findOne(id);
  }

  @Mutation(() => Vehicle)
  @UseGuards(JwtAuthGuard)
  async createVehicle(
    @Args('createVehicleInput') input: CreateVehicleInput,
  ): Promise<Vehicle> {
    return this.vehiclesService.create(input);
  }

  @Mutation(() => Vehicle)
  @UseGuards(JwtAuthGuard)
  async updateVehicle(
    @Args('updateVehicleInput') input: UpdateVehicleInput,
  ): Promise<Vehicle> {
    return this.vehiclesService.update(input);
  }

  @Mutation(() => Vehicle)
  @UseGuards(JwtAuthGuard)
  async deleteVehicle(@Args('id') id: string): Promise<Vehicle> {
    return this.vehiclesService.remove(id);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/fleet/vehicles.service.ts apps/api/src/fleet/vehicles.resolver.ts
git commit -m "feat(fleet): add vehicles service and resolver"
```

---

### Task 5: Vehicle Documents Service & Resolver

**Files:**
- Create: `apps/api/src/fleet/vehicle-documents.service.ts`
- Create: `apps/api/src/fleet/vehicle-documents.resolver.ts`

- [ ] **Step 1: Create vehicle-documents.service.ts**

```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDocumentInput } from './dto/create-vehicle-document.input';
import { UpdateVehicleDocumentInput } from './dto/update-vehicle-document.input';
import { VehicleDocument } from './entities/vehicle-document.entity';
import { ExpiringDocumentSummary } from './entities/expiring-document-summary.type';
import { DocumentType } from '@prisma/client';

@Injectable()
export class VehicleDocumentsService {
  constructor(private prisma: PrismaService) {}

  async create(input: CreateVehicleDocumentInput): Promise<VehicleDocument> {
    return this.prisma.vehicleDocument.create({ data: input });
  }

  async findByVehicle(vehicleId: string): Promise<VehicleDocument[]> {
    return this.prisma.vehicleDocument.findMany({
      where: { vehicleId },
      orderBy: { expiryDate: 'asc' },
    });
  }

  async update(input: UpdateVehicleDocumentInput): Promise<VehicleDocument> {
    const doc = await this.prisma.vehicleDocument.findUnique({ where: { id: input.id } });
    if (!doc) throw new NotFoundException(`Document with ID ${input.id} not found`);

    const { id, ...data } = input;
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined),
    );

    return this.prisma.vehicleDocument.update({ where: { id }, data: cleanData });
  }

  async remove(id: string): Promise<VehicleDocument> {
    const doc = await this.prisma.vehicleDocument.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException(`Document with ID ${id} not found`);
    return this.prisma.vehicleDocument.delete({ where: { id } });
  }

  async findExpiring(daysAhead: number): Promise<ExpiringDocumentSummary[]> {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + daysAhead);

    const documents = await this.prisma.vehicleDocument.findMany({
      where: { expiryDate: { gte: now, lte: future } },
      select: { type: true },
    });

    const counts = new Map<DocumentType, number>();
    for (const doc of documents) {
      counts.set(doc.type, (counts.get(doc.type) ?? 0) + 1);
    }

    return Array.from(counts.entries()).map(([type, count]) => ({ type, count }));
  }
}
```

- [ ] **Step 2: Create vehicle-documents.resolver.ts**

```ts
import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { VehicleDocumentsService } from './vehicle-documents.service';
import { VehicleDocument } from './entities/vehicle-document.entity';
import { ExpiringDocumentSummary } from './entities/expiring-document-summary.type';
import { CreateVehicleDocumentInput } from './dto/create-vehicle-document.input';
import { UpdateVehicleDocumentInput } from './dto/update-vehicle-document.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Resolver(() => VehicleDocument)
export class VehicleDocumentsResolver {
  constructor(private readonly vehicleDocumentsService: VehicleDocumentsService) {}

  @Query(() => [VehicleDocument], { name: 'vehicleDocuments' })
  @UseGuards(JwtAuthGuard)
  async findByVehicle(@Args('vehicleId') vehicleId: string): Promise<VehicleDocument[]> {
    return this.vehicleDocumentsService.findByVehicle(vehicleId);
  }

  @Query(() => [ExpiringDocumentSummary], { name: 'expiringDocuments' })
  @UseGuards(JwtAuthGuard)
  async findExpiring(
    @Args('daysAhead', { type: () => Int }) daysAhead: number,
  ): Promise<ExpiringDocumentSummary[]> {
    return this.vehicleDocumentsService.findExpiring(daysAhead);
  }

  @Mutation(() => VehicleDocument)
  @UseGuards(JwtAuthGuard)
  async createVehicleDocument(
    @Args('createVehicleDocumentInput') input: CreateVehicleDocumentInput,
  ): Promise<VehicleDocument> {
    return this.vehicleDocumentsService.create(input);
  }

  @Mutation(() => VehicleDocument)
  @UseGuards(JwtAuthGuard)
  async updateVehicleDocument(
    @Args('updateVehicleDocumentInput') input: UpdateVehicleDocumentInput,
  ): Promise<VehicleDocument> {
    return this.vehicleDocumentsService.update(input);
  }

  @Mutation(() => VehicleDocument)
  @UseGuards(JwtAuthGuard)
  async deleteVehicleDocument(@Args('id') id: string): Promise<VehicleDocument> {
    return this.vehicleDocumentsService.remove(id);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/fleet/vehicle-documents.service.ts apps/api/src/fleet/vehicle-documents.resolver.ts
git commit -m "feat(fleet): add vehicle documents service and resolver"
```

---

### Task 6: Mileage Service & Resolver

**Files:**
- Create: `apps/api/src/fleet/mileage.service.ts`
- Create: `apps/api/src/fleet/mileage.resolver.ts`

- [ ] **Step 1: Create mileage.service.ts**

```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMileageLogInput } from './dto/create-mileage-log.input';
import { MileageLog } from './entities/mileage-log.entity';

@Injectable()
export class MileageService {
  constructor(private prisma: PrismaService) {}

  async create(input: CreateMileageLogInput): Promise<MileageLog> {
    return this.prisma.mileageLog.create({ data: input });
  }

  async findByVehicle(vehicleId: string): Promise<MileageLog[]> {
    return this.prisma.mileageLog.findMany({
      where: { vehicleId },
      orderBy: { date: 'desc' },
    });
  }

  async remove(id: string): Promise<MileageLog> {
    const log = await this.prisma.mileageLog.findUnique({ where: { id } });
    if (!log) throw new NotFoundException(`Mileage log with ID ${id} not found`);
    return this.prisma.mileageLog.delete({ where: { id } });
  }
}
```

- [ ] **Step 2: Create mileage.resolver.ts**

```ts
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { MileageService } from './mileage.service';
import { MileageLog } from './entities/mileage-log.entity';
import { CreateMileageLogInput } from './dto/create-mileage-log.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Resolver(() => MileageLog)
export class MileageResolver {
  constructor(private readonly mileageService: MileageService) {}

  @Query(() => [MileageLog], { name: 'mileageLogs' })
  @UseGuards(JwtAuthGuard)
  async findByVehicle(@Args('vehicleId') vehicleId: string): Promise<MileageLog[]> {
    return this.mileageService.findByVehicle(vehicleId);
  }

  @Mutation(() => MileageLog)
  @UseGuards(JwtAuthGuard)
  async createMileageLog(
    @Args('createMileageLogInput') input: CreateMileageLogInput,
  ): Promise<MileageLog> {
    return this.mileageService.create(input);
  }

  @Mutation(() => MileageLog)
  @UseGuards(JwtAuthGuard)
  async deleteMileageLog(@Args('id') id: string): Promise<MileageLog> {
    return this.mileageService.remove(id);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/fleet/mileage.service.ts apps/api/src/fleet/mileage.resolver.ts
git commit -m "feat(fleet): add mileage service and resolver"
```

---

### Task 7: Leases Service & Resolver

**Files:**
- Create: `apps/api/src/fleet/leases.service.ts`
- Create: `apps/api/src/fleet/leases.resolver.ts`

- [ ] **Step 1: Create leases.service.ts**

```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleLeaseInput } from './dto/create-vehicle-lease.input';
import { UpdateVehicleLeaseInput } from './dto/update-vehicle-lease.input';
import { VehicleLease } from './entities/vehicle-lease.entity';

@Injectable()
export class LeasesService {
  constructor(private prisma: PrismaService) {}

  async create(input: CreateVehicleLeaseInput): Promise<VehicleLease> {
    return this.prisma.vehicleLease.create({ data: input });
  }

  async findByVehicle(vehicleId: string): Promise<VehicleLease[]> {
    return this.prisma.vehicleLease.findMany({
      where: { vehicleId },
      orderBy: { startDate: 'desc' },
    });
  }

  async update(input: UpdateVehicleLeaseInput): Promise<VehicleLease> {
    const lease = await this.prisma.vehicleLease.findUnique({ where: { id: input.id } });
    if (!lease) throw new NotFoundException(`Lease with ID ${input.id} not found`);

    const { id, ...data } = input;
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined),
    );

    return this.prisma.vehicleLease.update({ where: { id }, data: cleanData });
  }

  async remove(id: string): Promise<VehicleLease> {
    const lease = await this.prisma.vehicleLease.findUnique({ where: { id } });
    if (!lease) throw new NotFoundException(`Lease with ID ${id} not found`);
    return this.prisma.vehicleLease.delete({ where: { id } });
  }
}
```

- [ ] **Step 2: Create leases.resolver.ts**

```ts
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { LeasesService } from './leases.service';
import { VehicleLease } from './entities/vehicle-lease.entity';
import { CreateVehicleLeaseInput } from './dto/create-vehicle-lease.input';
import { UpdateVehicleLeaseInput } from './dto/update-vehicle-lease.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Resolver(() => VehicleLease)
export class LeasesResolver {
  constructor(private readonly leasesService: LeasesService) {}

  @Query(() => [VehicleLease], { name: 'vehicleLeases' })
  @UseGuards(JwtAuthGuard)
  async findByVehicle(@Args('vehicleId') vehicleId: string): Promise<VehicleLease[]> {
    return this.leasesService.findByVehicle(vehicleId);
  }

  @Mutation(() => VehicleLease)
  @UseGuards(JwtAuthGuard)
  async createVehicleLease(
    @Args('createVehicleLeaseInput') input: CreateVehicleLeaseInput,
  ): Promise<VehicleLease> {
    return this.leasesService.create(input);
  }

  @Mutation(() => VehicleLease)
  @UseGuards(JwtAuthGuard)
  async updateVehicleLease(
    @Args('updateVehicleLeaseInput') input: UpdateVehicleLeaseInput,
  ): Promise<VehicleLease> {
    return this.leasesService.update(input);
  }

  @Mutation(() => VehicleLease)
  @UseGuards(JwtAuthGuard)
  async deleteVehicleLease(@Args('id') id: string): Promise<VehicleLease> {
    return this.leasesService.remove(id);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/fleet/leases.service.ts apps/api/src/fleet/leases.resolver.ts
git commit -m "feat(fleet): add leases service and resolver"
```

---

### Task 8: Expenses Service & Resolver

**Files:**
- Create: `apps/api/src/fleet/expenses.service.ts`
- Create: `apps/api/src/fleet/expenses.resolver.ts`

- [ ] **Step 1: Create expenses.service.ts**

```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleExpenseInput } from './dto/create-vehicle-expense.input';
import { VehicleExpense } from './entities/vehicle-expense.entity';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async create(input: CreateVehicleExpenseInput): Promise<VehicleExpense> {
    return this.prisma.vehicleExpense.create({ data: input });
  }

  async findByVehicle(vehicleId: string): Promise<VehicleExpense[]> {
    return this.prisma.vehicleExpense.findMany({
      where: { vehicleId },
      orderBy: { date: 'desc' },
    });
  }

  async remove(id: string): Promise<VehicleExpense> {
    const expense = await this.prisma.vehicleExpense.findUnique({ where: { id } });
    if (!expense) throw new NotFoundException(`Expense with ID ${id} not found`);
    return this.prisma.vehicleExpense.delete({ where: { id } });
  }
}
```

- [ ] **Step 2: Create expenses.resolver.ts**

```ts
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { VehicleExpense } from './entities/vehicle-expense.entity';
import { CreateVehicleExpenseInput } from './dto/create-vehicle-expense.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Resolver(() => VehicleExpense)
export class ExpensesResolver {
  constructor(private readonly expensesService: ExpensesService) {}

  @Query(() => [VehicleExpense], { name: 'vehicleExpenses' })
  @UseGuards(JwtAuthGuard)
  async findByVehicle(@Args('vehicleId') vehicleId: string): Promise<VehicleExpense[]> {
    return this.expensesService.findByVehicle(vehicleId);
  }

  @Mutation(() => VehicleExpense)
  @UseGuards(JwtAuthGuard)
  async createVehicleExpense(
    @Args('createVehicleExpenseInput') input: CreateVehicleExpenseInput,
  ): Promise<VehicleExpense> {
    return this.expensesService.create(input);
  }

  @Mutation(() => VehicleExpense)
  @UseGuards(JwtAuthGuard)
  async deleteVehicleExpense(@Args('id') id: string): Promise<VehicleExpense> {
    return this.expensesService.remove(id);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/fleet/expenses.service.ts apps/api/src/fleet/expenses.resolver.ts
git commit -m "feat(fleet): add expenses service and resolver"
```

---

### Task 9: Fleet Module + App Module Registration

**Files:**
- Create: `apps/api/src/fleet/fleet.module.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Create fleet.module.ts**

```ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { VehiclesResolver } from './vehicles.resolver';
import { VehicleDocumentsResolver } from './vehicle-documents.resolver';
import { MileageResolver } from './mileage.resolver';
import { LeasesResolver } from './leases.resolver';
import { ExpensesResolver } from './expenses.resolver';
import { VehiclesService } from './vehicles.service';
import { VehicleDocumentsService } from './vehicle-documents.service';
import { MileageService } from './mileage.service';
import { LeasesService } from './leases.service';
import { ExpensesService } from './expenses.service';

@Module({
  imports: [PrismaModule],
  providers: [
    VehiclesResolver,
    VehicleDocumentsResolver,
    MileageResolver,
    LeasesResolver,
    ExpensesResolver,
    VehiclesService,
    VehicleDocumentsService,
    MileageService,
    LeasesService,
    ExpensesService,
  ],
  exports: [VehiclesService, VehicleDocumentsService],
})
export class FleetModule {}
```

- [ ] **Step 2: Register FleetModule in app.module.ts**

Add to imports in `apps/api/src/app.module.ts`:
```ts
import { FleetModule } from './fleet/fleet.module';
```
And add `FleetModule` to the `imports` array.

- [ ] **Step 3: Typecheck backend**

```bash
cd apps/api && bun run typecheck
```

Expected: No errors.

- [ ] **Step 4: Start API and verify GraphQL schema**

```bash
cd apps/api && bun run start:dev
```

Open `http://localhost:3000/graphql` and verify `vehicles`, `vehicle`, `expiringDocuments`, `createVehicle` etc. appear in the schema.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/fleet/fleet.module.ts apps/api/src/app.module.ts
git commit -m "feat(fleet): register fleet module"
```

---

## Chunk 3: Frontend Foundation

### Task 10: Fleet Types

**Files:**
- Create: `apps/web/src/types/fleet.types.ts`

- [ ] **Step 1: Create fleet.types.ts**

```ts
export enum FuelType {
  DIESEL = 'DIESEL',
  PETROL = 'PETROL',
  ELECTRIC = 'ELECTRIC',
  HYBRID = 'HYBRID',
}

export enum VehicleStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
}

export enum DocumentType {
  ITP = 'ITP',
  RCA = 'RCA',
  CASCO = 'CASCO',
  ROVINIETA = 'ROVINIETA',
}

export enum ExpenseType {
  FUEL = 'FUEL',
  REPAIR = 'REPAIR',
  OTHER = 'OTHER',
}

export interface VehicleDocument {
  id: string;
  vehicleId: string;
  type: DocumentType;
  expiryDate: string;
  issuedDate?: string | null;
  provider?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MileageLog {
  id: string;
  vehicleId: string;
  date: string;
  odometer: number;
  notes?: string | null;
  createdAt: string;
}

export interface VehicleLease {
  id: string;
  vehicleId: string;
  provider: string;
  startDate: string;
  endDate: string;
  monthlyRate: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleExpense {
  id: string;
  vehicleId: string;
  type: ExpenseType;
  amount: number;
  date: string;
  description?: string | null;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  chassisNumber: string;
  brand: string;
  model: string;
  year: number;
  fuelType: FuelType;
  status: VehicleStatus;
  createdAt: string;
  updatedAt: string;
  documents?: VehicleDocument[];
  mileageLogs?: MileageLog[];
  leases?: VehicleLease[];
  expenses?: VehicleExpense[];
}

export interface ExpiringDocumentSummary {
  type: DocumentType;
  count: number;
}

export interface CreateVehicleInput {
  plateNumber: string;
  chassisNumber: string;
  brand: string;
  model: string;
  year: number;
  fuelType: FuelType;
}

export interface UpdateVehicleInput {
  id: string;
  plateNumber?: string;
  chassisNumber?: string;
  brand?: string;
  model?: string;
  year?: number;
  fuelType?: FuelType;
  status?: VehicleStatus;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/types/fleet.types.ts
git commit -m "feat(fleet): add fleet TypeScript types"
```

---

### Task 11: Fleet GraphQL Queries & Mutations

**Files:**
- Create: `apps/web/src/graphql/mutations/fleet.queries.ts`
- Create: `apps/web/src/graphql/mutations/fleet.mutations.ts`

- [ ] **Step 1: Create fleet.queries.ts**

```ts
import { gql } from "@apollo/client";

export const GET_VEHICLES_QUERY = gql`
  query GetVehicles($pagination: PaginationInput) {
    vehicles(pagination: $pagination) {
      items {
        id
        plateNumber
        chassisNumber
        brand
        model
        year
        fuelType
        status
        createdAt
        updatedAt
      }
      meta {
        total
        skip
        take
      }
    }
  }
`;

export const GET_VEHICLE_QUERY = gql`
  query GetVehicle($id: String!) {
    vehicle(id: $id) {
      id
      plateNumber
      chassisNumber
      brand
      model
      year
      fuelType
      status
      createdAt
      updatedAt
      documents {
        id
        vehicleId
        type
        expiryDate
        issuedDate
        provider
        createdAt
        updatedAt
      }
      mileageLogs {
        id
        vehicleId
        date
        odometer
        notes
        createdAt
      }
      leases {
        id
        vehicleId
        provider
        startDate
        endDate
        monthlyRate
        notes
        createdAt
        updatedAt
      }
      expenses {
        id
        vehicleId
        type
        amount
        date
        description
        createdAt
      }
    }
  }
`;

export const GET_EXPIRING_DOCUMENTS_QUERY = gql`
  query GetExpiringDocuments($daysAhead: Int!) {
    expiringDocuments(daysAhead: $daysAhead) {
      type
      count
    }
  }
`;
```

- [ ] **Step 2: Create fleet.mutations.ts**

```ts
import { gql } from "@apollo/client";

export const CREATE_VEHICLE_MUTATION = gql`
  mutation CreateVehicle($createVehicleInput: CreateVehicleInput!) {
    createVehicle(createVehicleInput: $createVehicleInput) {
      id
      plateNumber
      chassisNumber
      brand
      model
      year
      fuelType
      status
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_VEHICLE_MUTATION = gql`
  mutation UpdateVehicle($updateVehicleInput: UpdateVehicleInput!) {
    updateVehicle(updateVehicleInput: $updateVehicleInput) {
      id
      plateNumber
      chassisNumber
      brand
      model
      year
      fuelType
      status
      updatedAt
    }
  }
`;

export const DELETE_VEHICLE_MUTATION = gql`
  mutation DeleteVehicle($id: String!) {
    deleteVehicle(id: $id) {
      id
    }
  }
`;

export const CREATE_VEHICLE_DOCUMENT_MUTATION = gql`
  mutation CreateVehicleDocument($createVehicleDocumentInput: CreateVehicleDocumentInput!) {
    createVehicleDocument(createVehicleDocumentInput: $createVehicleDocumentInput) {
      id
      vehicleId
      type
      expiryDate
      issuedDate
      provider
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_VEHICLE_DOCUMENT_MUTATION = gql`
  mutation UpdateVehicleDocument($updateVehicleDocumentInput: UpdateVehicleDocumentInput!) {
    updateVehicleDocument(updateVehicleDocumentInput: $updateVehicleDocumentInput) {
      id
      vehicleId
      type
      expiryDate
      issuedDate
      provider
      updatedAt
    }
  }
`;

export const DELETE_VEHICLE_DOCUMENT_MUTATION = gql`
  mutation DeleteVehicleDocument($id: String!) {
    deleteVehicleDocument(id: $id) {
      id
    }
  }
`;

export const CREATE_MILEAGE_LOG_MUTATION = gql`
  mutation CreateMileageLog($createMileageLogInput: CreateMileageLogInput!) {
    createMileageLog(createMileageLogInput: $createMileageLogInput) {
      id
      vehicleId
      date
      odometer
      notes
      createdAt
    }
  }
`;

export const DELETE_MILEAGE_LOG_MUTATION = gql`
  mutation DeleteMileageLog($id: String!) {
    deleteMileageLog(id: $id) {
      id
    }
  }
`;

export const CREATE_VEHICLE_LEASE_MUTATION = gql`
  mutation CreateVehicleLease($createVehicleLeaseInput: CreateVehicleLeaseInput!) {
    createVehicleLease(createVehicleLeaseInput: $createVehicleLeaseInput) {
      id
      vehicleId
      provider
      startDate
      endDate
      monthlyRate
      notes
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_VEHICLE_LEASE_MUTATION = gql`
  mutation UpdateVehicleLease($updateVehicleLeaseInput: UpdateVehicleLeaseInput!) {
    updateVehicleLease(updateVehicleLeaseInput: $updateVehicleLeaseInput) {
      id
      vehicleId
      provider
      startDate
      endDate
      monthlyRate
      notes
      updatedAt
    }
  }
`;

export const DELETE_VEHICLE_LEASE_MUTATION = gql`
  mutation DeleteVehicleLease($id: String!) {
    deleteVehicleLease(id: $id) {
      id
    }
  }
`;

export const CREATE_VEHICLE_EXPENSE_MUTATION = gql`
  mutation CreateVehicleExpense($createVehicleExpenseInput: CreateVehicleExpenseInput!) {
    createVehicleExpense(createVehicleExpenseInput: $createVehicleExpenseInput) {
      id
      vehicleId
      type
      amount
      date
      description
      createdAt
    }
  }
`;

export const DELETE_VEHICLE_EXPENSE_MUTATION = gql`
  mutation DeleteVehicleExpense($id: String!) {
    deleteVehicleExpense(id: $id) {
      id
    }
  }
`;
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/graphql/mutations/fleet.queries.ts apps/web/src/graphql/mutations/fleet.mutations.ts
git commit -m "feat(fleet): add fleet GraphQL queries and mutations"
```

---

### Task 12: Fleet Zod Schemas

**Files:**
- Create: `apps/web/src/lib/schemas/fleet.schema.ts`

- [ ] **Step 1: Create fleet.schema.ts**

```ts
import { z } from 'zod';

export const FuelTypeEnum = {
  DIESEL: 'DIESEL',
  PETROL: 'PETROL',
  ELECTRIC: 'ELECTRIC',
  HYBRID: 'HYBRID',
} as const;

export const VehicleStatusEnum = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  MAINTENANCE: 'MAINTENANCE',
} as const;

export const DocumentTypeEnum = {
  ITP: 'ITP',
  RCA: 'RCA',
  CASCO: 'CASCO',
  ROVINIETA: 'ROVINIETA',
} as const;

export const ExpenseTypeEnum = {
  FUEL: 'FUEL',
  REPAIR: 'REPAIR',
  OTHER: 'OTHER',
} as const;

export const createVehicleSchema = z.object({
  plateNumber: z.string().min(1, 'Plate number is required').max(20),
  chassisNumber: z.string().min(1, 'Chassis number is required').max(50),
  brand: z.string().min(1, 'Brand is required').max(100),
  model: z.string().min(1, 'Model is required').max(100),
  year: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1),
  fuelType: z.enum([
    FuelTypeEnum.DIESEL,
    FuelTypeEnum.PETROL,
    FuelTypeEnum.ELECTRIC,
    FuelTypeEnum.HYBRID,
  ]),
});

export type CreateVehicleFormData = z.infer<typeof createVehicleSchema>;

export const updateVehicleSchema = createVehicleSchema.partial().extend({
  status: z.enum([
    VehicleStatusEnum.ACTIVE,
    VehicleStatusEnum.INACTIVE,
    VehicleStatusEnum.MAINTENANCE,
  ]).optional(),
});

export type UpdateVehicleFormData = z.infer<typeof updateVehicleSchema>;

export const createVehicleDocumentSchema = z.object({
  type: z.enum([
    DocumentTypeEnum.ITP,
    DocumentTypeEnum.RCA,
    DocumentTypeEnum.CASCO,
    DocumentTypeEnum.ROVINIETA,
  ]),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  issuedDate: z.string().optional().or(z.literal('')),
  provider: z.string().max(200).optional().or(z.literal('')),
});

export type CreateVehicleDocumentFormData = z.infer<typeof createVehicleDocumentSchema>;

export const updateVehicleDocumentSchema = z.object({
  expiryDate: z.string().optional(),
  issuedDate: z.string().optional().or(z.literal('')),
  provider: z.string().max(200).optional().or(z.literal('')),
});

export type UpdateVehicleDocumentFormData = z.infer<typeof updateVehicleDocumentSchema>;

export const createMileageLogSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  odometer: z.coerce.number().int().min(0, 'Odometer must be a positive number'),
  notes: z.string().max(500).optional().or(z.literal('')),
});

export type CreateMileageLogFormData = z.infer<typeof createMileageLogSchema>;

export const createVehicleLeaseSchema = z.object({
  provider: z.string().min(1, 'Provider is required').max(200),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  monthlyRate: z.coerce.number().positive('Monthly rate must be positive'),
  notes: z.string().max(500).optional().or(z.literal('')),
});

export type CreateVehicleLeaseFormData = z.infer<typeof createVehicleLeaseSchema>;

export const updateVehicleLeaseSchema = createVehicleLeaseSchema.partial();
export type UpdateVehicleLeaseFormData = z.infer<typeof updateVehicleLeaseSchema>;

export const createVehicleExpenseSchema = z.object({
  type: z.enum([
    ExpenseTypeEnum.FUEL,
    ExpenseTypeEnum.REPAIR,
    ExpenseTypeEnum.OTHER,
  ]),
  amount: z.coerce.number().positive('Amount must be positive'),
  date: z.string().min(1, 'Date is required'),
  description: z.string().max(500).optional().or(z.literal('')),
});

export type CreateVehicleExpenseFormData = z.infer<typeof createVehicleExpenseSchema>;
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/lib/schemas/fleet.schema.ts
git commit -m "feat(fleet): add fleet Zod validation schemas"
```

---

### Task 13: Badge Components

**Files:**
- Create: `apps/web/src/components/fleet/VehicleStatusBadge.tsx`
- Create: `apps/web/src/components/fleet/DocumentTypeBadge.tsx`

- [ ] **Step 1: Create VehicleStatusBadge.tsx**

```tsx
import { cn } from '@/lib/utils';
import { VehicleStatus } from '@/types/fleet.types';

interface VehicleStatusBadgeProps {
  status: VehicleStatus;
}

const statusConfig: Record<VehicleStatus, { label: string; className: string }> = {
  ACTIVE: { label: 'Active', className: 'bg-green-100 text-green-700' },
  MAINTENANCE: { label: 'Maintenance', className: 'bg-yellow-100 text-yellow-700' },
  INACTIVE: { label: 'Inactive', className: 'bg-gray-100 text-gray-600' },
};

export function VehicleStatusBadge({ status }: VehicleStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}
```

- [ ] **Step 2: Create DocumentTypeBadge.tsx**

```tsx
import { cn } from '@/lib/utils';
import { DocumentType } from '@/types/fleet.types';

interface DocumentTypeBadgeProps {
  type: DocumentType;
}

export function DocumentTypeBadge({ type }: DocumentTypeBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
        'bg-blue-50 text-blue-700',
      )}
    >
      {type}
    </span>
  );
}
```

- [ ] **Step 3: Typecheck frontend**

```bash
cd apps/web && bun run typecheck
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/fleet/
git commit -m "feat(fleet): add vehicle status and document type badge components"
```

---

## Chunk 4: Frontend Pages & Integration

### Task 14: VehiclesPage

**Files:**
- Create: `apps/web/src/pages/fleet/VehiclesPage.tsx`

- [ ] **Step 1: Create VehiclesPage.tsx**

```tsx
import { useQuery } from "@apollo/client/react";
import { useNavigate } from 'react-router-dom';
import { Plus, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination } from '@/components/common/Pagination';
import { VehicleStatusBadge } from '@/components/fleet/VehicleStatusBadge';
import { usePagination } from '@/hooks/usePagination';
import { GET_VEHICLES_QUERY } from '@/graphql/mutations/fleet.queries';
import type { Vehicle } from '@/types/fleet.types';
import type { PaginatedResult } from '@/types/pagination.types';

export default function VehiclesPage() {
  const navigate = useNavigate();
  const { page, pageSize, skip, take, setPage } = usePagination();

  const { data, loading, error } = useQuery<{ vehicles: PaginatedResult<Vehicle> }>(
    GET_VEHICLES_QUERY,
    { variables: { pagination: { skip, take } }, fetchPolicy: 'cache-and-network' },
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading vehicles...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Error loading vehicles: {error.message}</div>
      </div>
    );
  }

  const vehicles = data?.vehicles.items ?? [];
  const totalItems = data?.vehicles.meta.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Fleet</h1>
          <p className="text-slate-600 mt-1">Manage company vehicles and documents</p>
        </div>
        <Button onClick={() => navigate('/fleet/create')} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Vehicle
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Vehicles</CardTitle>
        </CardHeader>
        <CardContent>
          {vehicles.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Car className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium">No vehicles found</p>
              <p className="text-sm mt-1">Get started by adding your first vehicle</p>
              <Button onClick={() => navigate('/fleet/create')} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Add Vehicle
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b text-left text-sm font-medium text-slate-600">
                    <th className="pb-3">Plate Number</th>
                    <th className="pb-3">Vehicle</th>
                    <th className="pb-3">Year</th>
                    <th className="pb-3">Fuel Type</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="border-b hover:bg-slate-50">
                      <td className="py-4 font-medium text-slate-900">{vehicle.plateNumber}</td>
                      <td className="py-4 text-slate-700">
                        {vehicle.brand} {vehicle.model}
                      </td>
                      <td className="py-4 text-slate-700">{vehicle.year}</td>
                      <td className="py-4 text-slate-600 capitalize">
                        {vehicle.fuelType.toLowerCase()}
                      </td>
                      <td className="py-4">
                        <VehicleStatusBadge status={vehicle.status} />
                      </td>
                      <td className="py-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/fleet/${vehicle.id}`)}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Pagination
        currentPage={page}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/pages/fleet/VehiclesPage.tsx
git commit -m "feat(fleet): add vehicles list page"
```

---

### Task 15: VehicleCreatePage

**Files:**
- Create: `apps/web/src/pages/fleet/VehicleCreatePage.tsx`

- [ ] **Step 1: Create VehicleCreatePage.tsx**

```tsx
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from "@apollo/client/react";
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createVehicleSchema, type CreateVehicleFormData, FuelTypeEnum } from '@/lib/schemas/fleet.schema';
import { CREATE_VEHICLE_MUTATION } from '@/graphql/mutations/fleet.mutations';
import { GET_VEHICLES_QUERY } from '@/graphql/mutations/fleet.queries';

export default function VehicleCreatePage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateVehicleFormData>({
    resolver: zodResolver(createVehicleSchema),
  });

  const [createVehicle] = useMutation(CREATE_VEHICLE_MUTATION, {
    refetchQueries: [GET_VEHICLES_QUERY],
    onCompleted: () => navigate('/fleet'),
  });

  const onSubmit = async (data: CreateVehicleFormData) => {
    await createVehicle({
      variables: { createVehicleInput: { ...data, year: Number(data.year) } },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/fleet')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Add Vehicle</h1>
          <p className="text-slate-600 mt-1">Register a new vehicle in the fleet</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Vehicle Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plateNumber">Plate Number *</Label>
                <Input id="plateNumber" {...register('plateNumber')} placeholder="e.g. B 123 ABC" />
                {errors.plateNumber && (
                  <p className="text-xs text-red-600">{errors.plateNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="chassisNumber">Chassis Number (VIN) *</Label>
                <Input id="chassisNumber" {...register('chassisNumber')} placeholder="17-character VIN" />
                {errors.chassisNumber && (
                  <p className="text-xs text-red-600">{errors.chassisNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Brand *</Label>
                <Input id="brand" {...register('brand')} placeholder="e.g. Dacia" />
                {errors.brand && (
                  <p className="text-xs text-red-600">{errors.brand.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model *</Label>
                <Input id="model" {...register('model')} placeholder="e.g. Logan" />
                {errors.model && (
                  <p className="text-xs text-red-600">{errors.model.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Year *</Label>
                <Input
                  id="year"
                  type="number"
                  {...register('year')}
                  placeholder={String(new Date().getFullYear())}
                />
                {errors.year && (
                  <p className="text-xs text-red-600">{errors.year.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Fuel Type *</Label>
                <Select onValueChange={(v) => setValue('fuelType', v as CreateVehicleFormData['fuelType'])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fuel type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(FuelTypeEnum).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0) + type.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.fuelType && (
                  <p className="text-xs text-red-600">{errors.fuelType.message}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add Vehicle'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/fleet')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/pages/fleet/VehicleCreatePage.tsx
git commit -m "feat(fleet): add vehicle create page"
```

---

### Task 16: VehicleDetailPage

**Files:**
- Create: `apps/web/src/pages/fleet/VehicleDetailPage.tsx`

- [ ] **Step 1: Create VehicleDetailPage.tsx**

This is the most complex page — 5 tabs. Build the full component:

```tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from "@apollo/client/react";
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Pencil, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { VehicleStatusBadge } from '@/components/fleet/VehicleStatusBadge';
import { DocumentTypeBadge } from '@/components/fleet/DocumentTypeBadge';
import { GET_VEHICLE_QUERY } from '@/graphql/mutations/fleet.queries';
import {
  UPDATE_VEHICLE_MUTATION,
  CREATE_VEHICLE_DOCUMENT_MUTATION,
  UPDATE_VEHICLE_DOCUMENT_MUTATION,
  DELETE_VEHICLE_DOCUMENT_MUTATION,
  CREATE_MILEAGE_LOG_MUTATION,
  DELETE_MILEAGE_LOG_MUTATION,
  CREATE_VEHICLE_LEASE_MUTATION,
  UPDATE_VEHICLE_LEASE_MUTATION,
  DELETE_VEHICLE_LEASE_MUTATION,
  CREATE_VEHICLE_EXPENSE_MUTATION,
  DELETE_VEHICLE_EXPENSE_MUTATION,
} from '@/graphql/mutations/fleet.mutations';
import {
  createVehicleDocumentSchema,
  type CreateVehicleDocumentFormData,
  updateVehicleDocumentSchema,
  type UpdateVehicleDocumentFormData,
  createMileageLogSchema,
  type CreateMileageLogFormData,
  createVehicleLeaseSchema,
  type CreateVehicleLeaseFormData,
  updateVehicleLeaseSchema,
  type UpdateVehicleLeaseFormData,
  createVehicleExpenseSchema,
  type CreateVehicleExpenseFormData,
  DocumentTypeEnum,
  ExpenseTypeEnum,
  FuelTypeEnum,
  VehicleStatusEnum,
  updateVehicleSchema,
  type UpdateVehicleFormData,
} from '@/lib/schemas/fleet.schema';
import type {
  Vehicle,
  VehicleDocument,
  VehicleLease,
} from '@/types/fleet.types';

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [editVehicleOpen, setEditVehicleOpen] = useState(false);
  const [addDocOpen, setAddDocOpen] = useState(false);
  const [editDocOpen, setEditDocOpen] = useState<VehicleDocument | null>(null);
  const [addMileageOpen, setAddMileageOpen] = useState(false);
  const [addLeaseOpen, setAddLeaseOpen] = useState(false);
  const [editLeaseOpen, setEditLeaseOpen] = useState<VehicleLease | null>(null);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);

  const { data, loading, error, refetch } = useQuery<{ vehicle: Vehicle }>(
    GET_VEHICLE_QUERY,
    { variables: { id }, fetchPolicy: 'cache-and-network' },
  );

  const refetchVehicle = () => refetch();

  const [updateVehicle] = useMutation(UPDATE_VEHICLE_MUTATION, { onCompleted: () => { setEditVehicleOpen(false); refetchVehicle(); } });
  const [createDoc] = useMutation(CREATE_VEHICLE_DOCUMENT_MUTATION, { onCompleted: () => { setAddDocOpen(false); refetchVehicle(); } });
  const [updateDoc] = useMutation(UPDATE_VEHICLE_DOCUMENT_MUTATION, { onCompleted: () => { setEditDocOpen(null); refetchVehicle(); } });
  const [deleteDoc] = useMutation(DELETE_VEHICLE_DOCUMENT_MUTATION, { onCompleted: refetchVehicle });
  const [createMileage] = useMutation(CREATE_MILEAGE_LOG_MUTATION, { onCompleted: () => { setAddMileageOpen(false); refetchVehicle(); } });
  const [deleteMileage] = useMutation(DELETE_MILEAGE_LOG_MUTATION, { onCompleted: refetchVehicle });
  const [createLease] = useMutation(CREATE_VEHICLE_LEASE_MUTATION, { onCompleted: () => { setAddLeaseOpen(false); refetchVehicle(); } });
  const [updateLease] = useMutation(UPDATE_VEHICLE_LEASE_MUTATION, { onCompleted: () => { setEditLeaseOpen(null); refetchVehicle(); } });
  const [deleteLease] = useMutation(DELETE_VEHICLE_LEASE_MUTATION, { onCompleted: refetchVehicle });
  const [createExpense] = useMutation(CREATE_VEHICLE_EXPENSE_MUTATION, { onCompleted: () => { setAddExpenseOpen(false); refetchVehicle(); } });
  const [deleteExpense] = useMutation(DELETE_VEHICLE_EXPENSE_MUTATION, { onCompleted: refetchVehicle });

  const editVehicleForm = useForm<UpdateVehicleFormData>({ resolver: zodResolver(updateVehicleSchema) });
  const addDocForm = useForm<CreateVehicleDocumentFormData>({ resolver: zodResolver(createVehicleDocumentSchema) });
  const editDocForm = useForm<UpdateVehicleDocumentFormData>({ resolver: zodResolver(updateVehicleDocumentSchema) });
  const mileageForm = useForm<CreateMileageLogFormData>({ resolver: zodResolver(createMileageLogSchema) });
  const addLeaseForm = useForm<CreateVehicleLeaseFormData>({ resolver: zodResolver(createVehicleLeaseSchema) });
  const editLeaseForm = useForm<UpdateVehicleLeaseFormData>({ resolver: zodResolver(updateVehicleLeaseSchema) });
  const expenseForm = useForm<CreateVehicleExpenseFormData>({ resolver: zodResolver(createVehicleExpenseSchema) });

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="text-lg">Loading...</div></div>;
  if (error || !data?.vehicle) return <div className="flex items-center justify-center min-h-screen"><div className="text-lg text-red-600">Vehicle not found.</div></div>;

  const vehicle = data.vehicle;
  const totalExpenses = (vehicle.expenses ?? []).reduce((sum, e) => sum + e.amount, 0);

  const openEditVehicle = () => {
    editVehicleForm.reset({
      plateNumber: vehicle.plateNumber,
      chassisNumber: vehicle.chassisNumber,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      fuelType: vehicle.fuelType as UpdateVehicleFormData['fuelType'],
      status: vehicle.status as UpdateVehicleFormData['status'],
    });
    setEditVehicleOpen(true);
  };

  const openEditDoc = (doc: VehicleDocument) => {
    editDocForm.reset({
      expiryDate: doc.expiryDate.slice(0, 10),
      issuedDate: doc.issuedDate ? doc.issuedDate.slice(0, 10) : '',
      provider: doc.provider ?? '',
    });
    setEditDocOpen(doc);
  };

  const openEditLease = (lease: VehicleLease) => {
    editLeaseForm.reset({
      provider: lease.provider,
      startDate: lease.startDate.slice(0, 10),
      endDate: lease.endDate.slice(0, 10),
      monthlyRate: lease.monthlyRate,
      notes: lease.notes ?? '',
    });
    setEditLeaseOpen(lease);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/fleet')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900">
              {vehicle.brand} {vehicle.model}
            </h1>
            <VehicleStatusBadge status={vehicle.status} />
          </div>
          <p className="text-slate-600 mt-1">{vehicle.plateNumber}</p>
        </div>
        <Button variant="outline" onClick={openEditVehicle} className="gap-2">
          <Pencil className="h-4 w-4" />
          Edit Vehicle
        </Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="mileage">Mileage</TabsTrigger>
          <TabsTrigger value="lease">Lease</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview">
          <Card>
            <CardHeader><CardTitle>Vehicle Details</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                {[
                  ['Plate Number', vehicle.plateNumber],
                  ['Chassis Number', vehicle.chassisNumber],
                  ['Brand', vehicle.brand],
                  ['Model', vehicle.model],
                  ['Year', String(vehicle.year)],
                  ['Fuel Type', vehicle.fuelType.charAt(0) + vehicle.fuelType.slice(1).toLowerCase()],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="font-medium text-slate-500">{label}</dt>
                    <dd className="text-slate-900 mt-1">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DOCUMENTS TAB */}
        <TabsContent value="documents">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Documents</CardTitle>
              <Button size="sm" onClick={() => setAddDocOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Add Document
              </Button>
            </CardHeader>
            <CardContent>
              {(vehicle.documents ?? []).length === 0 ? (
                <p className="text-slate-500 text-sm py-4">No documents added yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-slate-600 font-medium">
                      <th className="pb-3">Type</th>
                      <th className="pb-3">Expiry Date</th>
                      <th className="pb-3">Issued Date</th>
                      <th className="pb-3">Provider</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(vehicle.documents ?? []).map((doc) => (
                      <tr key={doc.id} className="border-b hover:bg-slate-50">
                        <td className="py-3"><DocumentTypeBadge type={doc.type} /></td>
                        <td className="py-3">{new Date(doc.expiryDate).toLocaleDateString('ro-RO')}</td>
                        <td className="py-3">{doc.issuedDate ? new Date(doc.issuedDate).toLocaleDateString('ro-RO') : '—'}</td>
                        <td className="py-3 text-slate-600">{doc.provider ?? '—'}</td>
                        <td className="py-3">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEditDoc(doc)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteDoc({ variables: { id: doc.id } })}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* MILEAGE TAB */}
        <TabsContent value="mileage">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Mileage Log</CardTitle>
              <Button size="sm" onClick={() => setAddMileageOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Add Entry
              </Button>
            </CardHeader>
            <CardContent>
              {(vehicle.mileageLogs ?? []).length === 0 ? (
                <p className="text-slate-500 text-sm py-4">No mileage entries yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-slate-600 font-medium">
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Odometer (km)</th>
                      <th className="pb-3">Notes</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(vehicle.mileageLogs ?? []).map((log) => (
                      <tr key={log.id} className="border-b hover:bg-slate-50">
                        <td className="py-3">{new Date(log.date).toLocaleDateString('ro-RO')}</td>
                        <td className="py-3 font-medium">{log.odometer.toLocaleString()}</td>
                        <td className="py-3 text-slate-600">{log.notes ?? '—'}</td>
                        <td className="py-3">
                          <Button variant="ghost" size="icon" onClick={() => deleteMileage({ variables: { id: log.id } })}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* LEASE TAB */}
        <TabsContent value="lease">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Lease Contracts</CardTitle>
              <Button size="sm" onClick={() => setAddLeaseOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Add Lease
              </Button>
            </CardHeader>
            <CardContent>
              {(vehicle.leases ?? []).length === 0 ? (
                <p className="text-slate-500 text-sm py-4">No lease contracts added.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-slate-600 font-medium">
                      <th className="pb-3">Provider</th>
                      <th className="pb-3">Start Date</th>
                      <th className="pb-3">End Date</th>
                      <th className="pb-3">Monthly Rate</th>
                      <th className="pb-3">Notes</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(vehicle.leases ?? []).map((lease) => (
                      <tr key={lease.id} className="border-b hover:bg-slate-50">
                        <td className="py-3 font-medium">{lease.provider}</td>
                        <td className="py-3">{new Date(lease.startDate).toLocaleDateString('ro-RO')}</td>
                        <td className="py-3">{new Date(lease.endDate).toLocaleDateString('ro-RO')}</td>
                        <td className="py-3">{lease.monthlyRate.toLocaleString('ro-RO', { style: 'currency', currency: 'RON' })}</td>
                        <td className="py-3 text-slate-600">{lease.notes ?? '—'}</td>
                        <td className="py-3">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEditLease(lease)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteLease({ variables: { id: lease.id } })}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* EXPENSES TAB */}
        <TabsContent value="expenses">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                Expenses
                {(vehicle.expenses ?? []).length > 0 && (
                  <span className="ml-2 text-sm font-normal text-slate-500">
                    Total: {totalExpenses.toLocaleString('ro-RO', { style: 'currency', currency: 'RON' })}
                  </span>
                )}
              </CardTitle>
              <Button size="sm" onClick={() => setAddExpenseOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Add Expense
              </Button>
            </CardHeader>
            <CardContent>
              {(vehicle.expenses ?? []).length === 0 ? (
                <p className="text-slate-500 text-sm py-4">No expenses recorded.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-slate-600 font-medium">
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Type</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Description</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(vehicle.expenses ?? []).map((expense) => (
                      <tr key={expense.id} className="border-b hover:bg-slate-50">
                        <td className="py-3">{new Date(expense.date).toLocaleDateString('ro-RO')}</td>
                        <td className="py-3 capitalize">{expense.type.toLowerCase()}</td>
                        <td className="py-3 font-medium">{expense.amount.toLocaleString('ro-RO', { style: 'currency', currency: 'RON' })}</td>
                        <td className="py-3 text-slate-600">{expense.description ?? '—'}</td>
                        <td className="py-3">
                          <Button variant="ghost" size="icon" onClick={() => deleteExpense({ variables: { id: expense.id } })}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* EDIT VEHICLE DIALOG */}
      <Dialog open={editVehicleOpen} onOpenChange={setEditVehicleOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Vehicle</DialogTitle></DialogHeader>
          <form onSubmit={editVehicleForm.handleSubmit((data) =>
            updateVehicle({ variables: { updateVehicleInput: { id: vehicle.id, ...data } } })
          )} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {(['plateNumber', 'chassisNumber', 'brand', 'model'] as const).map((field) => (
                <div key={field} className="space-y-2">
                  <Label>{field.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</Label>
                  <Input {...editVehicleForm.register(field)} />
                </div>
              ))}
              <div className="space-y-2">
                <Label>Year</Label>
                <Input type="number" {...editVehicleForm.register('year')} />
              </div>
              <div className="space-y-2">
                <Label>Fuel Type</Label>
                <Select
                  defaultValue={vehicle.fuelType}
                  onValueChange={(v) => editVehicleForm.setValue('fuelType', v as UpdateVehicleFormData['fuelType'])}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.values(FuelTypeEnum).map((t) => (
                      <SelectItem key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  defaultValue={vehicle.status}
                  onValueChange={(v) => editVehicleForm.setValue('status', v as UpdateVehicleFormData['status'])}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.values(VehicleStatusEnum).map((s) => (
                      <SelectItem key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit">Save Changes</Button>
              <Button type="button" variant="outline" onClick={() => setEditVehicleOpen(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ADD DOCUMENT DIALOG */}
      <Dialog open={addDocOpen} onOpenChange={setAddDocOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Document</DialogTitle></DialogHeader>
          <form onSubmit={addDocForm.handleSubmit((data) =>
            createDoc({ variables: { createVehicleDocumentInput: { vehicleId: vehicle.id, ...data, expiryDate: new Date(data.expiryDate), issuedDate: data.issuedDate ? new Date(data.issuedDate) : undefined } } })
          )} className="space-y-4">
            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select onValueChange={(v) => addDocForm.setValue('type', v as CreateVehicleDocumentFormData['type'])}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {Object.values(DocumentTypeEnum).map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {addDocForm.formState.errors.type && <p className="text-xs text-red-600">{addDocForm.formState.errors.type.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Expiry Date *</Label>
              <Input type="date" {...addDocForm.register('expiryDate')} />
            </div>
            <div className="space-y-2">
              <Label>Issued Date</Label>
              <Input type="date" {...addDocForm.register('issuedDate')} />
            </div>
            <div className="space-y-2">
              <Label>Provider</Label>
              <Input {...addDocForm.register('provider')} placeholder="e.g. RAR, Allianz" />
            </div>
            <div className="flex gap-3">
              <Button type="submit">Add Document</Button>
              <Button type="button" variant="outline" onClick={() => setAddDocOpen(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT DOCUMENT DIALOG */}
      <Dialog open={!!editDocOpen} onOpenChange={() => setEditDocOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Document</DialogTitle></DialogHeader>
          <form onSubmit={editDocForm.handleSubmit((data) =>
            updateDoc({ variables: { updateVehicleDocumentInput: { id: editDocOpen!.id, ...data, expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined, issuedDate: data.issuedDate ? new Date(data.issuedDate) : undefined } } })
          )} className="space-y-4">
            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Input type="date" {...editDocForm.register('expiryDate')} />
            </div>
            <div className="space-y-2">
              <Label>Issued Date</Label>
              <Input type="date" {...editDocForm.register('issuedDate')} />
            </div>
            <div className="space-y-2">
              <Label>Provider</Label>
              <Input {...editDocForm.register('provider')} />
            </div>
            <div className="flex gap-3">
              <Button type="submit">Save Changes</Button>
              <Button type="button" variant="outline" onClick={() => setEditDocOpen(null)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ADD MILEAGE DIALOG */}
      <Dialog open={addMileageOpen} onOpenChange={setAddMileageOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Mileage Entry</DialogTitle></DialogHeader>
          <form onSubmit={mileageForm.handleSubmit((data) =>
            createMileage({ variables: { createMileageLogInput: { vehicleId: vehicle.id, ...data, date: new Date(data.date), odometer: Number(data.odometer) } } })
          )} className="space-y-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input type="date" {...mileageForm.register('date')} />
            </div>
            <div className="space-y-2">
              <Label>Odometer (km) *</Label>
              <Input type="number" {...mileageForm.register('odometer')} placeholder="e.g. 125000" />
              {mileageForm.formState.errors.odometer && <p className="text-xs text-red-600">{mileageForm.formState.errors.odometer.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input {...mileageForm.register('notes')} placeholder="Optional notes" />
            </div>
            <div className="flex gap-3">
              <Button type="submit">Add Entry</Button>
              <Button type="button" variant="outline" onClick={() => setAddMileageOpen(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ADD LEASE DIALOG */}
      <Dialog open={addLeaseOpen} onOpenChange={setAddLeaseOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Lease Contract</DialogTitle></DialogHeader>
          <form onSubmit={addLeaseForm.handleSubmit((data) =>
            createLease({ variables: { createVehicleLeaseInput: { vehicleId: vehicle.id, ...data, startDate: new Date(data.startDate), endDate: new Date(data.endDate), monthlyRate: Number(data.monthlyRate) } } })
          )} className="space-y-4">
            <div className="space-y-2">
              <Label>Provider *</Label>
              <Input {...addLeaseForm.register('provider')} placeholder="e.g. BCR Leasing" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input type="date" {...addLeaseForm.register('startDate')} />
              </div>
              <div className="space-y-2">
                <Label>End Date *</Label>
                <Input type="date" {...addLeaseForm.register('endDate')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Monthly Rate (RON) *</Label>
              <Input type="number" step="0.01" {...addLeaseForm.register('monthlyRate')} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input {...addLeaseForm.register('notes')} />
            </div>
            <div className="flex gap-3">
              <Button type="submit">Add Lease</Button>
              <Button type="button" variant="outline" onClick={() => setAddLeaseOpen(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT LEASE DIALOG */}
      <Dialog open={!!editLeaseOpen} onOpenChange={() => setEditLeaseOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Lease Contract</DialogTitle></DialogHeader>
          <form onSubmit={editLeaseForm.handleSubmit((data) =>
            updateLease({ variables: { updateVehicleLeaseInput: { id: editLeaseOpen!.id, ...data, startDate: data.startDate ? new Date(data.startDate) : undefined, endDate: data.endDate ? new Date(data.endDate) : undefined, monthlyRate: data.monthlyRate ? Number(data.monthlyRate) : undefined } } })
          )} className="space-y-4">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Input {...editLeaseForm.register('provider')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" {...editLeaseForm.register('startDate')} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" {...editLeaseForm.register('endDate')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Monthly Rate (RON)</Label>
              <Input type="number" step="0.01" {...editLeaseForm.register('monthlyRate')} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input {...editLeaseForm.register('notes')} />
            </div>
            <div className="flex gap-3">
              <Button type="submit">Save Changes</Button>
              <Button type="button" variant="outline" onClick={() => setEditLeaseOpen(null)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ADD EXPENSE DIALOG */}
      <Dialog open={addExpenseOpen} onOpenChange={setAddExpenseOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
          <form onSubmit={expenseForm.handleSubmit((data) =>
            createExpense({ variables: { createVehicleExpenseInput: { vehicleId: vehicle.id, ...data, date: new Date(data.date), amount: Number(data.amount) } } })
          )} className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select onValueChange={(v) => expenseForm.setValue('type', v as CreateVehicleExpenseFormData['type'])}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {Object.values(ExpenseTypeEnum).map((t) => (
                    <SelectItem key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount (RON) *</Label>
              <Input type="number" step="0.01" {...expenseForm.register('amount')} />
              {expenseForm.formState.errors.amount && <p className="text-xs text-red-600">{expenseForm.formState.errors.amount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input type="date" {...expenseForm.register('date')} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input {...expenseForm.register('description')} placeholder="Optional description" />
            </div>
            <div className="flex gap-3">
              <Button type="submit">Add Expense</Button>
              <Button type="button" variant="outline" onClick={() => setAddExpenseOpen(false)}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/pages/fleet/VehicleDetailPage.tsx
git commit -m "feat(fleet): add vehicle detail page with tabs"
```

---

### Task 17: FleetExpiryWidget & Dashboard Integration

**Files:**
- Create: `apps/web/src/components/dashboard/FleetExpiryWidget.tsx`
- Modify: `apps/web/src/pages/DashboardPage.tsx`

- [ ] **Step 1: Create FleetExpiryWidget.tsx**

```tsx
import { useQuery } from "@apollo/client/react";
import { Link } from 'react-router-dom';
import { Car } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GET_EXPIRING_DOCUMENTS_QUERY } from '@/graphql/mutations/fleet.queries';
import type { ExpiringDocumentSummary } from '@/types/fleet.types';

export function FleetExpiryWidget() {
  const { data, loading } = useQuery<{ expiringDocuments: ExpiringDocumentSummary[] }>(
    GET_EXPIRING_DOCUMENTS_QUERY,
    { variables: { daysAhead: 30 } },
  );

  const summaries = (data?.expiringDocuments ?? []).filter((s) => s.count > 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Fleet — Expiring Documents</CardTitle>
        <Car className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
        {!loading && summaries.length === 0 && (
          <p className="text-sm text-green-600 font-medium">All documents up to date</p>
        )}
        {!loading && summaries.length > 0 && (
          <div className="space-y-2">
            {summaries.map((s) => (
              <Link
                key={s.type}
                to="/fleet"
                className="flex items-center justify-between text-sm hover:underline"
              >
                <span className="text-slate-700 font-medium">{s.type}</span>
                <span className="text-orange-600 font-semibold">
                  {s.count} {s.count === 1 ? 'vehicle' : 'vehicles'}
                </span>
              </Link>
            ))}
            <p className="text-xs text-muted-foreground pt-1">Expiring within 30 days</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Add FleetExpiryWidget to DashboardPage.tsx**

In `apps/web/src/pages/DashboardPage.tsx`, add the import:
```tsx
import { FleetExpiryWidget } from '@/components/dashboard/FleetExpiryWidget';
```

Add `<FleetExpiryWidget />` as an additional card inside the metrics grid (after the existing 8 cards).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/dashboard/FleetExpiryWidget.tsx apps/web/src/pages/DashboardPage.tsx
git commit -m "feat(fleet): add fleet expiry widget to dashboard"
```

---

### Task 18: Routes & Sidebar

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Add fleet routes to App.tsx**

Add imports:
```tsx
import VehiclesPage from './pages/fleet/VehiclesPage';
import VehicleCreatePage from './pages/fleet/VehicleCreatePage';
import VehicleDetailPage from './pages/fleet/VehicleDetailPage';
```

Add routes inside `<Routes>` (all authenticated, no role restriction):
```tsx
<Route
  path="/fleet"
  element={
    <ProtectedRoute>
      <DashboardLayout>
        <VehiclesPage />
      </DashboardLayout>
    </ProtectedRoute>
  }
/>
<Route
  path="/fleet/create"
  element={
    <ProtectedRoute>
      <DashboardLayout>
        <VehicleCreatePage />
      </DashboardLayout>
    </ProtectedRoute>
  }
/>
<Route
  path="/fleet/:id"
  element={
    <ProtectedRoute>
      <DashboardLayout>
        <VehicleDetailPage />
      </DashboardLayout>
    </ProtectedRoute>
  }
/>
```

- [ ] **Step 2: Add Fleet entry to Sidebar.tsx**

Add `Car` to the lucide-react import:
```tsx
import { ..., Car } from 'lucide-react';
```

Add a Fleet menu entry to `menuItems` array (after Reports, before Profile):
```ts
{
  title: 'Fleet',
  href: '/fleet',
  icon: Car,
  roles: [],
},
```

- [ ] **Step 3: Typecheck frontend**

```bash
cd apps/web && bun run typecheck
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/App.tsx apps/web/src/components/layout/Sidebar.tsx
git commit -m "feat(fleet): add fleet routes and sidebar entry"
```

---

### Task 19: End-to-End Verification

- [ ] **Step 1: Start API**

```bash
cd apps/api && bun run start:dev
```

- [ ] **Step 2: Start Web**

```bash
cd apps/web && bun run dev
```

- [ ] **Step 3: Verify these flows work**

1. Navigate to `/fleet` — vehicle list loads (empty state shown)
2. Navigate to `/fleet/create` — form renders, submit creates vehicle and redirects to `/fleet`
3. Navigate to `/fleet/:id` — detail page loads with all 5 tabs
4. Add a document in the Documents tab — appears in table
5. Add a mileage entry — appears in table
6. Navigate to `/dashboard` — FleetExpiryWidget renders (shows "All documents up to date" if no expiring docs)
7. Fleet entry appears in sidebar

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat(fleet): complete fleet module implementation"
```
