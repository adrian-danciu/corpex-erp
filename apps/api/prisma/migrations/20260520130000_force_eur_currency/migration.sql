ALTER TABLE "Invoice" ALTER COLUMN "currency" SET DEFAULT 'EUR';
ALTER TABLE "Project" ALTER COLUMN "currency" SET DEFAULT 'EUR';
ALTER TABLE "PurchaseOrder" ALTER COLUMN "currency" SET DEFAULT 'EUR';
ALTER TABLE "CompanySettings" ALTER COLUMN "defaultCurrency" SET DEFAULT 'EUR';

UPDATE "Invoice"
SET "currency" = 'EUR'
WHERE "currency" IS DISTINCT FROM 'EUR';

UPDATE "Project"
SET "currency" = 'EUR'
WHERE "currency" IS DISTINCT FROM 'EUR';

UPDATE "PurchaseOrder"
SET "currency" = 'EUR'
WHERE "currency" IS DISTINCT FROM 'EUR';

UPDATE "CompanySettings"
SET "defaultCurrency" = 'EUR'
WHERE "defaultCurrency" IS DISTINCT FROM 'EUR';
