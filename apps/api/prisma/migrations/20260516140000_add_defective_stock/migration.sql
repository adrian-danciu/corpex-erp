-- AlterEnum
ALTER TYPE "StockMovementType" ADD VALUE 'DEFECT';
ALTER TYPE "StockMovementType" ADD VALUE 'SCRAP';

-- AlterTable
ALTER TABLE "ProductStock" ADD COLUMN "defectiveQty" DOUBLE PRECISION NOT NULL DEFAULT 0;
