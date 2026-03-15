-- Step 1: Create the new Department enum
CREATE TYPE "Department" AS ENUM ('HR', 'FINANCE', 'WAREHOUSE', 'FLEET', 'MANAGEMENT', 'IT');

-- Step 2: Add a temporary column for the new enum type
ALTER TABLE "Employee" ADD COLUMN "department_new" "Department";

-- Step 3: Migrate existing string values to enum values
UPDATE "Employee" SET "department_new" = 'HR'::"Department"
  WHERE LOWER(department) LIKE '%hr%' OR LOWER(department) LIKE '%human%';
UPDATE "Employee" SET "department_new" = 'FINANCE'::"Department"
  WHERE LOWER(department) LIKE '%financ%' OR LOWER(department) LIKE '%account%';
UPDATE "Employee" SET "department_new" = 'WAREHOUSE'::"Department"
  WHERE LOWER(department) LIKE '%warehouse%' OR LOWER(department) LIKE '%stock%' OR LOWER(department) LIKE '%depozit%';
UPDATE "Employee" SET "department_new" = 'FLEET'::"Department"
  WHERE LOWER(department) LIKE '%fleet%' OR LOWER(department) LIKE '%transport%' OR LOWER(department) LIKE '%logistic%';
UPDATE "Employee" SET "department_new" = 'MANAGEMENT'::"Department"
  WHERE LOWER(department) LIKE '%manage%' OR LOWER(department) LIKE '%director%' OR LOWER(department) LIKE '%executiv%';
UPDATE "Employee" SET "department_new" = 'IT'::"Department"
  WHERE LOWER(department) LIKE '%it%' OR LOWER(department) LIKE '%tech%' OR LOWER(department) LIKE '%softw%';
-- Fallback: any remaining unmapped rows go to IT
UPDATE "Employee" SET "department_new" = 'IT'::"Department" WHERE "department_new" IS NULL;

-- Step 4: Drop old column, rename new column
ALTER TABLE "Employee" DROP COLUMN "department";
ALTER TABLE "Employee" RENAME COLUMN "department_new" TO "department";

-- Step 5: Make the column NOT NULL
ALTER TABLE "Employee" ALTER COLUMN "department" SET NOT NULL;

-- Step 6: Migrate old Role values to USER before dropping enum variants
UPDATE "User" SET role = 'USER'::"Role" WHERE role::text IN ('MANAGER', 'HR', 'FINANCE');

-- Step 7: Recreate Role enum with only ADMIN and USER
-- Drop default first so the ALTER COLUMN can proceed
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TYPE "Role" RENAME TO "Role_old";
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role" USING role::text::"Role";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER'::"Role";
DROP TYPE "Role_old";
