---
name: prisma-migration
description: Create and apply a Prisma migration for schema changes in apps/api
disable-model-invocation: true
---

## Create and Apply a Prisma Migration

1. Ask the user for a migration name if not provided (e.g., `add_stock_warehouse_fields`, `update_employee_department`)

2. Run the migration:
   ```bash
   cd apps/api && bunx prisma migrate dev --name <migration-name>
   ```

3. Regenerate the Prisma client:
   ```bash
   bunx prisma generate
   ```

4. Verify the generated SQL in `apps/api/prisma/migrations/<timestamp>_<name>/migration.sql`

5. If seeding is needed, run:
   ```bash
   bunx prisma db seed
   ```

## Tips
- Migration names should be snake_case and describe what changed (e.g., `add_invoice_status_field`)
- Always review the generated SQL before applying to production
- Schema file is at `apps/api/prisma/schema.prisma`
