import { ObjectType } from '@nestjs/graphql';
import { Paginated } from '../../common/dto/pagination-result.dto';
import { PurchaseOrder } from '../entities/purchase-order.entity';

@ObjectType()
export class PaginatedPurchaseOrder extends Paginated(PurchaseOrder) {}
