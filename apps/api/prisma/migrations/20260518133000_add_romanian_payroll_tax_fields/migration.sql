ALTER TABLE "CompanySettings"
  ADD COLUMN "payrollTaxCasRate" DOUBLE PRECISION NOT NULL DEFAULT 25,
  ADD COLUMN "payrollTaxCassRate" DOUBLE PRECISION NOT NULL DEFAULT 10,
  ADD COLUMN "payrollTaxIncomeRate" DOUBLE PRECISION NOT NULL DEFAULT 10,
  ADD COLUMN "payrollTaxCamRate" DOUBLE PRECISION NOT NULL DEFAULT 2.25,
  ADD COLUMN "payrollPersonalDeduction" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "payrollTaxRuleVersion" TEXT NOT NULL DEFAULT 'RO_2026_STANDARD';

ALTER TABLE "PayrollLine"
  ADD COLUMN "unpaidLeaveDeduction" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "taxableGross" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "casRate" DOUBLE PRECISION NOT NULL DEFAULT 25,
  ADD COLUMN "casAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "cassRate" DOUBLE PRECISION NOT NULL DEFAULT 10,
  ADD COLUMN "cassAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "incomeTaxRate" DOUBLE PRECISION NOT NULL DEFAULT 10,
  ADD COLUMN "incomeTaxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "camRate" DOUBLE PRECISION NOT NULL DEFAULT 2.25,
  ADD COLUMN "camAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "employerTotalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "taxRuleVersion" TEXT NOT NULL DEFAULT 'RO_2026_STANDARD';

UPDATE "PayrollLine"
SET
  "taxableGross" = GREATEST("baseSalary" + "bonus", 0),
  "casAmount" = ROUND((GREATEST("baseSalary" + "bonus", 0) * 0.25)::numeric, 2)::DOUBLE PRECISION,
  "cassAmount" = ROUND((GREATEST("baseSalary" + "bonus", 0) * 0.10)::numeric, 2)::DOUBLE PRECISION,
  "incomeTaxAmount" = ROUND(((GREATEST("baseSalary" + "bonus", 0) - (GREATEST("baseSalary" + "bonus", 0) * 0.25) - (GREATEST("baseSalary" + "bonus", 0) * 0.10)) * 0.10)::numeric, 2)::DOUBLE PRECISION,
  "camAmount" = ROUND((GREATEST("baseSalary" + "bonus", 0) * 0.0225)::numeric, 2)::DOUBLE PRECISION,
  "employerTotalCost" = ROUND((GREATEST("baseSalary" + "bonus", 0) * 1.0225)::numeric, 2)::DOUBLE PRECISION,
  "netAmount" = ROUND((GREATEST("baseSalary" + "bonus", 0) - (GREATEST("baseSalary" + "bonus", 0) * 0.25) - (GREATEST("baseSalary" + "bonus", 0) * 0.10) - ((GREATEST("baseSalary" + "bonus", 0) - (GREATEST("baseSalary" + "bonus", 0) * 0.25) - (GREATEST("baseSalary" + "bonus", 0) * 0.10)) * 0.10) - "deductions")::numeric, 2)::DOUBLE PRECISION;
