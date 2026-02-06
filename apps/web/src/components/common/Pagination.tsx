import {
    Pagination as ShadcnPagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    PaginationEllipsis,
} from "@/components/ui/pagination";

interface PaginationProps {
    currentPage: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
}

export function Pagination({
    currentPage,
    totalItems,
    pageSize,
    onPageChange,
}: PaginationProps) {
    const totalPages = Math.ceil(totalItems / pageSize);

    if (totalPages <= 1) return null;

    const handlePrevious = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    // Simple logic to show a window of pages
    // For production, a more complex logic (like 1 ... 4 5 6 ... 10) is better
    // Here we show: First, Prev (if applicable), Current, Next (if applicable), Last

    // Generating page numbers to display
    const getPageNumbers = () => {
        const pages = [];

        // Always show first page
        pages.push(1);

        // If current page is far from start, add dots
        if (currentPage > 3) {
            pages.push("dots-start");
        }

        // Recent neighbors
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
            pages.push(i);
        }

        // If current page is far from end, add dots
        if (currentPage < totalPages - 2) {
            pages.push("dots-end");
        }

        // Always show last page if > 1
        if (totalPages > 1) {
            pages.push(totalPages);
        }

        // Remove duplicates just in case logic overlaps
        return [...new Set(pages)];
    };

    const pageNumbers = getPageNumbers();

    return (
        <ShadcnPagination>
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious
                        onClick={handlePrevious}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                </PaginationItem>

                {pageNumbers.map((page, index) => {
                    if (page === "dots-start" || page === "dots-end") {
                        return (
                            <PaginationItem key={`dots-${index}`}>
                                <PaginationEllipsis />
                            </PaginationItem>
                        );
                    }

                    return (
                        <PaginationItem key={page}>
                            <PaginationLink
                                isActive={currentPage === page}
                                onClick={() => onPageChange(page as number)}
                                className="cursor-pointer"
                            >
                                {page}
                            </PaginationLink>
                        </PaginationItem>
                    );
                })}

                <PaginationItem>
                    <PaginationNext
                        onClick={handleNext}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                </PaginationItem>
            </PaginationContent>
        </ShadcnPagination>
    );
}
