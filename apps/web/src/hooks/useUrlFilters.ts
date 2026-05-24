import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

interface SetFilterOptions {
  resetPage?: boolean;
  replace?: boolean;
}

type FilterValue = string | null | undefined;

export function useUrlFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const getFilter = useCallback(
    (key: string, fallback = "") => searchParams.get(key) ?? fallback,
    [searchParams],
  );

  const setFilters = useCallback(
    (
      updates: Record<string, FilterValue>,
      { resetPage = true, replace = false }: SetFilterOptions = {},
    ) => {
      const nextParams = new URLSearchParams(searchParams);

      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          nextParams.set(key, value);
        } else {
          nextParams.delete(key);
        }
      });

      if (resetPage) {
        nextParams.set("page", "1");
      }

      setSearchParams(nextParams, { replace });
    },
    [searchParams, setSearchParams],
  );

  const setFilter = useCallback(
    (key: string, value: FilterValue, options?: SetFilterOptions) => {
      setFilters({ [key]: value }, options);
    },
    [setFilters],
  );

  return { getFilter, setFilter, setFilters, searchParams };
}
