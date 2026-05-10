import { ObjectType } from '@nestjs/graphql';
import { Paginated } from '../../common/dto/pagination-result.dto';
import { Notification } from '../entities/notification.entity';

@ObjectType()
export class PaginatedNotification extends Paginated(Notification) {}
