import { ObjectType } from '@nestjs/graphql';
import { Paginated } from '../../common/dto/pagination-result.dto';
import { Warehouse } from '../entities/warehouse.entity';

@ObjectType()
export class PaginatedWarehouse extends Paginated(Warehouse) {}
