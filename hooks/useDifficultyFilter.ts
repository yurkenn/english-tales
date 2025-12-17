import { useState, useMemo, useCallback } from 'react';

type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
type DifficultyFilter = 'all' | DifficultyLevel;

interface StoryWithDifficulty {
    difficulty: string;
    [key: string]: any;
}

interface UseDifficultyFilterOptions<T extends StoryWithDifficulty> {
    items: T[];
    initialFilter?: DifficultyFilter;
}

interface UseDifficultyFilterReturn<T> {
    filter: DifficultyFilter;
    setFilter: (filter: DifficultyFilter) => void;
    cycleFilter: () => void;
    filteredItems: T[];
    stats: {
        total: number;
        beginner: number;
        intermediate: number;
        advanced: number;
    };
    getFilterLabel: () => string;
}

const FILTER_LABELS: Record<DifficultyFilter, string> = {
    all: 'All',
    beginner: 'Easy',
    intermediate: 'Medium',
    advanced: 'Hard',
};

const FILTERS: DifficultyFilter[] = ['all', 'beginner', 'intermediate', 'advanced'];

/**
 * Hook for filtering items by difficulty level with stats
 */
export const useDifficultyFilter = <T extends StoryWithDifficulty>({
    items,
    initialFilter = 'all',
}: UseDifficultyFilterOptions<T>): UseDifficultyFilterReturn<T> => {
    const [filter, setFilter] = useState<DifficultyFilter>(initialFilter);

    const filteredItems = useMemo(() => {
        if (filter === 'all') return items;
        return items.filter((item) => item.difficulty === filter);
    }, [items, filter]);

    const stats = useMemo(() => ({
        total: items.length,
        beginner: items.filter((item) => item.difficulty === 'beginner').length,
        intermediate: items.filter((item) => item.difficulty === 'intermediate').length,
        advanced: items.filter((item) => item.difficulty === 'advanced').length,
    }), [items]);

    const cycleFilter = useCallback(() => {
        const currentIndex = FILTERS.indexOf(filter);
        setFilter(FILTERS[(currentIndex + 1) % FILTERS.length]);
    }, [filter]);

    const getFilterLabel = useCallback(() => FILTER_LABELS[filter], [filter]);

    return {
        filter,
        setFilter,
        cycleFilter,
        filteredItems,
        stats,
        getFilterLabel,
    };
};

export type { DifficultyFilter, DifficultyLevel };
