import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProductFieldsResolver } from './product-fields.resolver';
import { ProductStockResolver } from './product-stock.resolver';
import {
  PurchaseOrderFieldsResolver,
  PurchaseOrderLineFieldsResolver,
  PurchaseOrderReceiptFieldsResolver,
} from './purchase-order-fields.resolver';
import { PurchaseOrdersResolver } from './purchase-orders.resolver';
import { PurchaseOrderReceivingService } from './purchase-order-receiving.service';
import { PurchaseOrdersService } from './purchase-orders.service';
import { StockResolver } from './stock.resolver';
import { StockService } from './stock.service';
import { StockLedgerService } from './stock-ledger.service';

@Module({
  imports: [PrismaModule, NotificationsModule],
  providers: [
    StockResolver,
    StockService,
    StockLedgerService,
    ProductStockResolver,
    ProductFieldsResolver,
    PurchaseOrdersResolver,
    PurchaseOrdersService,
    PurchaseOrderReceivingService,
    PurchaseOrderFieldsResolver,
    PurchaseOrderLineFieldsResolver,
    PurchaseOrderReceiptFieldsResolver,
  ],
  exports: [
    StockService,
    StockLedgerService,
    PurchaseOrdersService,
    PurchaseOrderReceivingService,
  ],
})
export class StockModule {}
