import { PaginationInput } from './dto/pagination.input';
import { IPaginatedType } from './dto/pagination-result.dto';

export const DEFAULT_PAGINATION: PaginationInput = {
  skip: 0,
  take: 10,
};

export function normalizePagination(
  pagination?: Partial<PaginationInput> | null,
  fallbackTake = DEFAULT_PAGINATION.take,
): PaginationInput {
  return {
    skip: pagination?.skip ?? DEFAULT_PAGINATION.skip,
    take: pagination?.take ?? fallbackTake,
  };
}

export function toPaginatedResult<T>(
  items: T[],
  total: number,
  pagination: PaginationInput,
): IPaginatedType<T> {
  return {
    items,
    meta: {
      total,
      skip: pagination.skip,
      take: pagination.take,
    },
  };
}
