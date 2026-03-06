import { ObjectType } from '@nestjs/graphql';
import { Paginated } from '../../common/dto/pagination-result.dto';
import { Product } from '../entities/product.entity';

@ObjectType()
export class PaginatedProduct extends Paginated(Product) {}
