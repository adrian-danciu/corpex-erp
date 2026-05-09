import { Field, Float, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { ProjectMaterialStatus } from '@prisma/client';
import { Product } from '../../stock/entities/product.entity';
import { Warehouse } from '../../stock/entities/warehouse.entity';

registerEnumType(ProjectMaterialStatus, { name: 'ProjectMaterialStatus' });

@ObjectType()
export class ProjectMaterial {
  @Field(() => ID)
  id: string;

  @Field()
  projectId: string;

  @Field()
  productId: string;

  @Field()
  warehouseId: string;

  @Field(() => Float)
  requestedQty: number;

  @Field(() => Float)
  reservedQty: number;

  @Field(() => Float)
  issuedQty: number;

  @Field(() => Float)
  unitCost: number;

  @Field(() => ProjectMaterialStatus)
  status: ProjectMaterialStatus;

  @Field(() => String, { nullable: true })
  notes?: string | null;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => Product, { nullable: true })
  product?: Product;

  @Field(() => Warehouse, { nullable: true })
  warehouse?: Warehouse;
}
