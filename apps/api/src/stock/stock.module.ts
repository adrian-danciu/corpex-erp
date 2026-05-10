import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProductStockResolver } from './product-stock.resolver';
import { StockResolver } from './stock.resolver';
import { StockService } from './stock.service';

@Module({
  imports: [PrismaModule, NotificationsModule],
  providers: [StockResolver, StockService, ProductStockResolver],
  exports: [StockService],
})
export class StockModule {}
