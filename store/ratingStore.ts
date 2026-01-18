/**
 * Rating Store - Zustand store for rating prompt state
 */
import { create } from 'zustand';
import { ratingService } from '@/services/ratingService';

interface RatingState {
    isInitialized: boolean;
    hasRated: boolean;
    promptCount: number;
}

interface RatingActions {
    initialize: () => Promise<void>;
    recordStoryComplete: () => Promise<void>;
    recordStreakMilestone: (streak: number) => Promise<void>;
    recordAchievement: () => Promise<void>;
    recordQuizSuccess: () => Promise<void>;
    checkAndPrompt: () => Promise<boolean>;
}

const initialState: RatingState = {
    isInitialized: false,
    hasRated: false,
    promptCount: 0,
};

export const useRatingStore = create<RatingState & { actions: RatingActions }>()((set, get) => ({
    ...initialState,

    actions: {
        initialize: async () => {
            if (get().isInitialized) return;

            await ratingService.initialize();
            const state = await ratingService.getState();

            set({
                isInitialized: true,
                hasRated: state.hasRated,
                promptCount: state.promptCount,
            });
        },

        recordStoryComplete: async () => {
            await ratingService.recordPositiveAction('story_complete');
            const state = await ratingService.getState();
            set({ promptCount: state.promptCount, hasRated: state.hasRated });
        },

        recordStreakMilestone: async (streak: number) => {
            await ratingService.updateStreak(streak);
            const state = await ratingService.getState();
            set({ promptCount: state.promptCount, hasRated: state.hasRated });
        },

        recordAchievement: async () => {
            await ratingService.recordPositiveAction('achievement');
            const state = await ratingService.getState();
            set({ promptCount: state.promptCount, hasRated: state.hasRated });
        },

        recordQuizSuccess: async () => {
            await ratingService.recordPositiveAction('quiz_success');
            const state = await ratingService.getState();
            set({ promptCount: state.promptCount, hasRated: state.hasRated });
        },

        checkAndPrompt: async () => {
            const shouldPrompt = await ratingService.shouldPromptRating();
            if (shouldPrompt) {
                const prompted = await ratingService.promptRating('story_complete');
                if (prompted) {
                    const state = await ratingService.getState();
                    set({ promptCount: state.promptCount });
                }
                return prompted;
            }
            return false;
        },
    },
}));

// Selector hooks
export const useRatingActions = () => useRatingStore((s) => s.actions);
