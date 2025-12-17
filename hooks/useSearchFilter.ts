import { useState, useMemo, useCallback } from 'react';

interface UseSearchFilterOptions<T> {
    items: T[];
    searchKeys: (keyof T)[];
    initialQuery?: string;
}

interface UseSearchFilterReturn<T> {
    query: string;
    setQuery: (query: string) => void;
    filteredItems: T[];
    clearSearch: () => void;
    hasResults: boolean;
}

/**
 * Hook for text-based search filtering across multiple fields
 */
export const useSearchFilter = <T extends Record<string, any>>({
    items,
    searchKeys,
    initialQuery = '',
}: UseSearchFilterOptions<T>): UseSearchFilterReturn<T> => {
    const [query, setQuery] = useState(initialQuery);

    const filteredItems = useMemo(() => {
        if (!query.trim()) return items;

        const lowerQuery = query.toLowerCase();
        return items.filter((item) =>
            searchKeys.some((key) => {
                const value = item[key];
                return typeof value === 'string' && value.toLowerCase().includes(lowerQuery);
            })
        );
    }, [items, query, searchKeys]);

    const clearSearch = useCallback(() => setQuery(''), []);

    return {
        query,
        setQuery,
        filteredItems,
        clearSearch,
        hasResults: filteredItems.length > 0,
    };
};
