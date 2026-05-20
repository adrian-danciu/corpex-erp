-- CreateEnum
CREATE TYPE "InvoiceItemSourceType" AS ENUM ('PROJECT_MATERIAL', 'PROJECT_SERVICE', 'VEHICLE_EXPENSE', 'MANUAL');

-- CreateEnum
CREATE TYPE "ProjectServiceStatus" AS ENUM ('PLANNED', 'DELIVERED', 'CANCELLED');

-- AlterTable
ALTER TABLE "InvoiceItem"
ADD COLUMN "projectId" TEXT,
ADD COLUMN "sourceType" "InvoiceItemSourceType",
ADD COLUMN "sourceId" TEXT;

-- CreateTable
CREATE TABLE "ProjectService" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'service',
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "vatRate" DOUBLE PRECISION NOT NULL DEFAULT 19,
    "status" "ProjectServiceStatus" NOT NULL DEFAULT 'DELIVERED',
    "billable" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectService_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InvoiceItem_projectId_idx" ON "InvoiceItem"("projectId");

-- CreateIndex
CREATE INDEX "InvoiceItem_sourceType_sourceId_idx" ON "InvoiceItem"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "ProjectService_projectId_status_billable_idx" ON "ProjectService"("projectId", "status", "billable");

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectService" ADD CONSTRAINT "ProjectService_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
