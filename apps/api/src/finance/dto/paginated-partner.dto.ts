import { ObjectType } from '@nestjs/graphql';
import { Paginated } from '../../common/dto/pagination-result.dto';
import { Partner } from '../entities/partner.entity';

@ObjectType()
export class PaginatedPartner extends Paginated(Partner) { }
