import { Field, ObjectType, Int } from '@nestjs/graphql';
import { Type } from '@nestjs/common';

@ObjectType()
export class PaginationMeta {
    @Field(() => Int)
    total: number;

    @Field(() => Int)
    skip: number;

    @Field(() => Int)
    take: number;
}

export interface IPaginatedType<T> {
    items: T[];
    meta: PaginationMeta;
}

export function Paginated<T>(classRef: Type<T>): Type<IPaginatedType<T>> {
    @ObjectType({ isAbstract: true })
    abstract class PaginatedType implements IPaginatedType<T> {
        @Field(() => [classRef])
        items: T[];

        @Field(() => PaginationMeta)
        meta: PaginationMeta;
    }
    return PaginatedType as Type<IPaginatedType<T>>;
}
