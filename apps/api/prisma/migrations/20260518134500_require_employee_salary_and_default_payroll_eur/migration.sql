UPDATE "Employee"
SET "salary" = 0
WHERE "salary" IS NULL;

ALTER TABLE "Employee"
  ALTER COLUMN "salary" SET NOT NULL;

ALTER TABLE "PayrollPeriod"
  ALTER COLUMN "currency" SET DEFAULT 'EUR';
