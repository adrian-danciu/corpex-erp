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
import { PurchaseOrdersService } from './purchase-orders.service';
import { StockResolver } from './stock.resolver';
import { StockService } from './stock.service';

@Module({
  imports: [PrismaModule, NotificationsModule],
  providers: [
    StockResolver,
    StockService,
    ProductStockResolver,
    ProductFieldsResolver,
    PurchaseOrdersResolver,
    PurchaseOrdersService,
    PurchaseOrderFieldsResolver,
    PurchaseOrderLineFieldsResolver,
    PurchaseOrderReceiptFieldsResolver,
  ],
  exports: [StockService, PurchaseOrdersService],
})
export class StockModule {}
