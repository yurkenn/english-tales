import { LibraryItem } from '@/types';

// Library Types
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

// Story Types
export type DifficultyFilter = 'all' | 'beginner' | 'intermediate' | 'advanced';

export const DIFFICULTY_COLORS: Record<string, string> = {
    beginner: '#10B981',
    intermediate: '#F59E0B',
    advanced: '#EF4444',
};

export const DIFFICULTY_LABELS: Record<string, string> = {
    beginner: 'Easy',
    intermediate: 'Medium',
    advanced: 'Hard',
};

export const STORY_FILTER_LABELS: Record<DifficultyFilter, string> = {
    all: 'All',
    beginner: 'Easy',
    intermediate: 'Medium',
    advanced: 'Hard',
};
