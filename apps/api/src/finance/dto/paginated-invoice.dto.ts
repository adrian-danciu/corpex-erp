import { ObjectType } from '@nestjs/graphql';
import { Paginated } from '../../common/dto/pagination-result.dto';
import { Invoice } from '../entities/invoice.entity';

@ObjectType()
export class PaginatedInvoice extends Paginated(Invoice) {}
