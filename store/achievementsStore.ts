import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { haptics } from '@/utils/haptics';

export type AchievementId =
    | 'first_story'
    | 'bookworm_5'
    | 'bookworm_10'
    | 'streak_3'
    | 'streak_7'
    | 'reviewer';

interface Achievement {
    id: AchievementId;
    title: string;
    description: string;
    icon: string;
    unlockedAt?: Date;
}

const ACHIEVEMENTS: Achievement[] = [
    { id: 'first_story', title: 'First Steps', description: 'Complete your first story', icon: '📖' },
    { id: 'bookworm_5', title: 'Bookworm', description: 'Complete 5 stories', icon: '📚' },
    { id: 'bookworm_10', title: 'Scholar', description: 'Complete 10 stories', icon: '🎓' },
    { id: 'streak_3', title: 'Consistent', description: 'Maintain a 3-day streak', icon: '🔥' },
    { id: 'streak_7', title: 'Dedicated', description: 'Maintain a 7-day streak', icon: '⭐' },
    { id: 'reviewer', title: 'Critic', description: 'Write your first review', icon: '✍️' },
];

interface AchievementsState {
    unlocked: Record<AchievementId, Date | null>;
    isLoaded: boolean;
    pendingUnlock: Achievement | null;
}

interface AchievementsActions {
    checkAndUnlock: (criteria: {
        completedStories: number;
        streak: number;
        hasReviewed: boolean;
    }) => void;
    loadAchievements: () => Promise<void>;
    dismissPending: () => void;
    getAll: () => (Achievement & { unlocked: boolean })[];
}

const STORAGE_KEY = '@english_tales_achievements';

export const useAchievementsStore = create<AchievementsState & { actions: AchievementsActions }>()((set, get) => ({
    unlocked: {
        first_story: null,
        bookworm_5: null,
        bookworm_10: null,
        streak_3: null,
        streak_7: null,
        reviewer: null,
    },
    isLoaded: false,
    pendingUnlock: null,

    actions: {
        checkAndUnlock: (criteria) => {
            const { unlocked } = get();
            const newUnlocks: Partial<Record<AchievementId, Date>> = {};

            // First story
            if (criteria.completedStories >= 1 && !unlocked.first_story) {
                newUnlocks.first_story = new Date();
            }
            // 5 stories
            if (criteria.completedStories >= 5 && !unlocked.bookworm_5) {
                newUnlocks.bookworm_5 = new Date();
            }
            // 10 stories
            if (criteria.completedStories >= 10 && !unlocked.bookworm_10) {
                newUnlocks.bookworm_10 = new Date();
            }
            // 3-day streak
            if (criteria.streak >= 3 && !unlocked.streak_3) {
                newUnlocks.streak_3 = new Date();
            }
            // 7-day streak
            if (criteria.streak >= 7 && !unlocked.streak_7) {
                newUnlocks.streak_7 = new Date();
            }
            // First review
            if (criteria.hasReviewed && !unlocked.reviewer) {
                newUnlocks.reviewer = new Date();
            }

            // If any new unlocks, update state and save
            const newIds = Object.keys(newUnlocks) as AchievementId[];
            if (newIds.length > 0) {
                const updated = { ...unlocked, ...newUnlocks };
                set({ unlocked: updated });

                // Show first new unlock as pending
                const firstUnlock = ACHIEVEMENTS.find(a => a.id === newIds[0]);
                if (firstUnlock) {
                    set({ pendingUnlock: { ...firstUnlock, unlockedAt: newUnlocks[newIds[0]] } });
                    haptics.success();
                }

                // Persist
                AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            }
        },

        loadAchievements: async () => {
            try {
                const saved = await AsyncStorage.getItem(STORAGE_KEY);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    set({ unlocked: parsed, isLoaded: true });
                } else {
                    set({ isLoaded: true });
                }
            } catch (e) {
                set({ isLoaded: true });
            }
        },

        dismissPending: () => set({ pendingUnlock: null }),

        getAll: () => {
            const { unlocked } = get();
            return ACHIEVEMENTS.map(a => ({
                ...a,
                unlocked: unlocked[a.id] !== null,
                unlockedAt: unlocked[a.id] || undefined,
            }));
        },
    },
}));
