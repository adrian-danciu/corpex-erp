export interface PaginationMeta {
    total: number;
    skip: number;
    take: number;
}

export interface PaginatedResult<T> {
    items: T[];
    meta: PaginationMeta;
}
