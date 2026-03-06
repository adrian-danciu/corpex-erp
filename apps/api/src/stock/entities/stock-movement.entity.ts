import { Field, Float, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { StockMovementType } from '@prisma/client';
import { Product } from './product.entity';
import { Warehouse } from './warehouse.entity';
import { User } from '../../users/entities/user.entity';

registerEnumType(StockMovementType, {
  name: 'StockMovementType',
  description: 'Type of stock movement',
});

@ObjectType()
export class StockMovement {
  @Field(() => ID)
  id: string;

  @Field()
  productId: string;

  @Field()
  warehouseId: string;

  @Field(() => StockMovementType)
  type: StockMovementType;

  @Field()
  quantity: number;

  @Field(() => Float, { nullable: true })
  unitCost?: number | null;

  @Field(() => String, { nullable: true })
  reference?: string | null;

  @Field(() => String, { nullable: true })
  notes?: string | null;

  @Field()
  performedAt: Date;

  @Field()
  createdById: string;

  @Field(() => Product)
  product: Product;

  @Field(() => Warehouse)
  warehouse: Warehouse;

  @Field(() => User)
  createdBy: User;

  @Field()
  createdAt: Date;
}
