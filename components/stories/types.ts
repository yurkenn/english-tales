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

export const FILTER_LABELS: Record<DifficultyFilter, string> = {
    all: 'All',
    beginner: 'Easy',
    intermediate: 'Medium',
    advanced: 'Hard',
};
