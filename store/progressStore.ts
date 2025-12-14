import { create } from 'zustand';
import { ReadingProgress } from '@/types';
import { Result } from '@/types/api';

// State
interface ProgressState {
    progressMap: Record<string, ReadingProgress>; // keyed by storyId
    isLoading: boolean;
    error: string | null;
}

// Actions
interface ProgressActions {
    updateProgress: (storyId: string, position: number, percentage: number) => Promise<Result<ReadingProgress>>;
    markComplete: (storyId: string) => Promise<Result<ReadingProgress>>;
    getProgress: (storyId: string) => ReadingProgress | undefined;
    fetchAllProgress: () => Promise<Result<Record<string, ReadingProgress>>>;
    clearProgress: () => void;
}

// Initial state
const initialState: ProgressState = {
    progressMap: {},
    isLoading: false,
    error: null,
};

export const useProgressStore = create<ProgressState & { actions: ProgressActions }>()((set, get) => ({
    ...initialState,

    actions: {
        updateProgress: async (storyId, position, percentage) => {
            try {
                // TODO: Add Firebase integration
                const progress: ReadingProgress = {
                    storyId,
                    userId: '', // Will be set from auth
                    currentPosition: position,
                    percentage,
                    lastReadAt: new Date(),
                    isCompleted: percentage >= 100,
                };
                set((state) => ({
                    progressMap: {
                        ...state.progressMap,
                        [storyId]: progress,
                    },
                }));
                return { success: true, data: progress };
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to update progress';
                set({ error: message });
                return { success: false, error: message };
            }
        },

        markComplete: async (storyId) => {
            try {
                const existing = get().progressMap[storyId];
                const progress: ReadingProgress = {
                    storyId,
                    userId: existing?.userId ?? '',
                    currentPosition: existing?.currentPosition ?? 0,
                    percentage: 100,
                    lastReadAt: new Date(),
                    isCompleted: true,
                };
                set((state) => ({
                    progressMap: {
                        ...state.progressMap,
                        [storyId]: progress,
                    },
                }));
                return { success: true, data: progress };
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to mark complete';
                set({ error: message });
                return { success: false, error: message };
            }
        },

        getProgress: (storyId) => {
            return get().progressMap[storyId];
        },

        fetchAllProgress: async () => {
            set({ isLoading: true, error: null });
            try {
                // TODO: Add Firebase integration
                const progressMap: Record<string, ReadingProgress> = {};
                set({ progressMap, isLoading: false });
                return { success: true, data: progressMap };
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to fetch progress';
                set({ isLoading: false, error: message });
                return { success: false, error: message };
            }
        },

        clearProgress: () => set({ progressMap: {} }),
    },
}));
