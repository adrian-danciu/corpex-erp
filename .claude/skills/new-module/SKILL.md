---
name: new-module
description: Scaffold a new NestJS GraphQL module following corpex-erp conventions (resolver, service, dto, prisma)
---

## Scaffold a New NestJS GraphQL Module

Use `apps/api/src/employees/` as the reference implementation for all conventions.

### File Structure to Create

```
apps/api/src/<module-name>/
├── <name>.module.ts
├── <name>.resolver.ts
├── <name>.service.ts
└── dto/
    └── <name>.dto.ts
```

### Step-by-step

1. **Ask the user** for the module name (singular, camelCase, e.g., `warehouse`, `contract`)

2. **Create `<name>.module.ts`** — imports Service and Resolver, registers with NestJS

3. **Create `<name>.service.ts`** — injects `PrismaService`, implements CRUD operations

4. **Create `dto/<name>.dto.ts`** — defines GraphQL ObjectType, CreateInput, UpdateInput using `@ObjectType()`, `@InputType()`, `@Field()` decorators

5. **Create `<name>.resolver.ts`** — GraphQL Resolver with `@Query()` and `@Mutation()` methods, protected with `@UseGuards(JwtAuthGuard)` where appropriate

6. **Register in `app.module.ts`** — add the new module to the `imports` array

### Conventions to Follow
- DTOs use `class-validator` decorators (`@IsString()`, `@IsOptional()`, etc.)
- Services use `PrismaService` (from `apps/api/src/prisma/`)
- Resolvers are protected with `JwtAuthGuard` for mutations
- All GraphQL types are defined in DTOs, not inline in resolvers
- Use `@nestjs/graphql` decorators throughout
