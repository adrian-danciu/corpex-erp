import { useSearchParams } from "react-router-dom";

interface UsePaginationProps {
    defaultPage?: number;
    defaultPageSize?: number;
}

export function usePagination({
    defaultPage = 1,
    defaultPageSize = 10,
}: UsePaginationProps = {}) {
    const [searchParams, setSearchParams] = useSearchParams();

    const page = Number(searchParams.get("page")) || defaultPage;
    const pageSize = Number(searchParams.get("pageSize")) || defaultPageSize;

    const setPage = (newPage: number) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set("page", newPage.toString());
        setSearchParams(newParams);
    };

    const setPageSize = (newPageSize: number) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set("pageSize", newPageSize.toString());
        // Reset to page 1 when changing page size
        newParams.set("page", "1");
        setSearchParams(newParams);
    };

    // GraphQL skip calculation
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    return {
        page,
        pageSize,
        setPage,
        setPageSize,
        skip,
        take,
    };
}
