import { ObjectType } from '@nestjs/graphql';
import { Paginated } from '../../common/dto/pagination-result.dto';
import { Vehicle } from '../entities/vehicle.entity';

@ObjectType()
export class PaginatedVehicle extends Paginated(Vehicle) {}
