-- AlterTable
ALTER TABLE "Invoice"
ADD COLUMN "purchaseOrderId" TEXT,
ADD COLUMN "purchaseReceiptId" TEXT;

-- CreateIndex
CREATE INDEX "Invoice_purchaseOrderId_idx" ON "Invoice"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "Invoice_purchaseReceiptId_idx" ON "Invoice"("purchaseReceiptId");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_purchaseReceiptId_fkey" FOREIGN KEY ("purchaseReceiptId") REFERENCES "PurchaseOrderReceipt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
