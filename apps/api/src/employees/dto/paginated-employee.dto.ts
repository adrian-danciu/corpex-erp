import { ObjectType } from '@nestjs/graphql';
import { Paginated } from '../../common/dto/pagination-result.dto';
import { Employee } from '../entities/employee.entity';

@ObjectType()
export class PaginatedEmployee extends Paginated(Employee) { }
