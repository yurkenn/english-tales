import { LibraryItem } from '@/types';

export type FilterType = 'all' | 'in-progress' | 'completed' | 'not-started';

export type LibraryItemWithProgress = Omit<LibraryItem, 'progress'> & {
    progress?: { percentage: number; isCompleted: boolean };
};

export const FILTER_LABELS: Record<FilterType, string> = {
    all: 'All',
    'in-progress': 'Reading',
    completed: 'Done',
    'not-started': 'New',
};

export const FILTERS: FilterType[] = ['all', 'in-progress', 'completed', 'not-started'];
