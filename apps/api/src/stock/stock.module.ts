import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StockResolver } from './stock.resolver';
import { StockService } from './stock.service';

@Module({
  imports: [PrismaModule],
  providers: [StockResolver, StockService],
  exports: [StockService],
})
export class StockModule {}
