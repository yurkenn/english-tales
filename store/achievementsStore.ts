/**
 * Achievements Store - Enhanced with Rarity & Categories
 */
import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { haptics } from '@/utils/haptics'

export type AchievementId =
    | 'first_story'
    | 'bookworm_5'
    | 'bookworm_10'
    | 'bookworm_25'
    | 'streak_3'
    | 'streak_7'
    | 'streak_30'
    | 'reviewer'
    | 'social_first_post'
    | 'social_popular'

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary'
export type AchievementCategory = 'reading' | 'streak' | 'social'

export interface Achievement {
    id: AchievementId
    title: string
    description: string
    icon: string
    rarity: AchievementRarity
    category: AchievementCategory
    target?: number // For progress tracking
    unlockedAt?: Date
}

// Rarity colors for UI
export const RARITY_COLORS: Record<AchievementRarity, { primary: string; glow: string }> = {
    common: { primary: '#9CA3AF', glow: 'rgba(156, 163, 175, 0.3)' },
    rare: { primary: '#3B82F6', glow: 'rgba(59, 130, 246, 0.4)' },
    epic: { primary: '#8B5CF6', glow: 'rgba(139, 92, 246, 0.5)' },
    legendary: { primary: '#F59E0B', glow: 'rgba(245, 158, 11, 0.6)' },
}

// Category icons
export const CATEGORY_ICONS: Record<AchievementCategory, string> = {
    reading: '📖',
    streak: '🔥',
    social: '👥',
}

const ACHIEVEMENTS: Achievement[] = [
    // Reading achievements
    { id: 'first_story', title: 'First Steps', description: 'Complete your first story', icon: '📖', rarity: 'common', category: 'reading', target: 1 },
    { id: 'bookworm_5', title: 'Bookworm', description: 'Complete 5 stories', icon: '📚', rarity: 'rare', category: 'reading', target: 5 },
    { id: 'bookworm_10', title: 'Scholar', description: 'Complete 10 stories', icon: '🎓', rarity: 'epic', category: 'reading', target: 10 },
    { id: 'bookworm_25', title: 'Master Reader', description: 'Complete 25 stories', icon: '👑', rarity: 'legendary', category: 'reading', target: 25 },

    // Streak achievements
    { id: 'streak_3', title: 'Consistent', description: 'Maintain a 3-day streak', icon: '🔥', rarity: 'common', category: 'streak', target: 3 },
    { id: 'streak_7', title: 'Dedicated', description: 'Maintain a 7-day streak', icon: '⭐', rarity: 'rare', category: 'streak', target: 7 },
    { id: 'streak_30', title: 'Unstoppable', description: 'Maintain a 30-day streak', icon: '💎', rarity: 'legendary', category: 'streak', target: 30 },

    // Social achievements
    { id: 'reviewer', title: 'Critic', description: 'Write your first review', icon: '✍️', rarity: 'rare', category: 'social' },
    { id: 'social_first_post', title: 'Voice', description: 'Share your first community post', icon: '💬', rarity: 'common', category: 'social' },
    { id: 'social_popular', title: 'Influencer', description: 'Get 10 likes on a post', icon: '🌟', rarity: 'epic', category: 'social', target: 10 },
]

interface AchievementsState {
    unlocked: Record<AchievementId, Date | null>
    isLoaded: boolean
    pendingUnlock: Achievement | null
}

interface AchievementCriteria {
    completedStories: number
    streak: number
    hasReviewed: boolean
    postsCount?: number
    maxLikes?: number
}

interface AchievementsActions {
    checkAndUnlock: (criteria: AchievementCriteria) => void
    loadAchievements: () => Promise<void>
    dismissPending: () => void
    getAll: () => (Achievement & { unlocked: boolean })[]
    getByCategory: (category: AchievementCategory) => (Achievement & { unlocked: boolean })[]
    getCategoryProgress: (category: AchievementCategory) => { unlocked: number; total: number }
    getProgress: (id: AchievementId, criteria: AchievementCriteria) => number
}

const STORAGE_KEY = '@english_tales_achievements'

const getDefaultUnlocked = (): Record<AchievementId, Date | null> => ({
    first_story: null,
    bookworm_5: null,
    bookworm_10: null,
    bookworm_25: null,
    streak_3: null,
    streak_7: null,
    streak_30: null,
    reviewer: null,
    social_first_post: null,
    social_popular: null,
})

export const useAchievementsStore = create<AchievementsState & { actions: AchievementsActions }>()((set, get) => ({
    unlocked: getDefaultUnlocked(),
    isLoaded: false,
    pendingUnlock: null,

    actions: {
        checkAndUnlock: (criteria) => {
            const { unlocked } = get()
            const newUnlocks: Partial<Record<AchievementId, Date>> = {}

            // Reading achievements
            if (criteria.completedStories >= 1 && !unlocked.first_story) {
                newUnlocks.first_story = new Date()
            }
            if (criteria.completedStories >= 5 && !unlocked.bookworm_5) {
                newUnlocks.bookworm_5 = new Date()
            }
            if (criteria.completedStories >= 10 && !unlocked.bookworm_10) {
                newUnlocks.bookworm_10 = new Date()
            }
            if (criteria.completedStories >= 25 && !unlocked.bookworm_25) {
                newUnlocks.bookworm_25 = new Date()
            }

            // Streak achievements
            if (criteria.streak >= 3 && !unlocked.streak_3) {
                newUnlocks.streak_3 = new Date()
            }
            if (criteria.streak >= 7 && !unlocked.streak_7) {
                newUnlocks.streak_7 = new Date()
            }
            if (criteria.streak >= 30 && !unlocked.streak_30) {
                newUnlocks.streak_30 = new Date()
            }

            // Social achievements
            if (criteria.hasReviewed && !unlocked.reviewer) {
                newUnlocks.reviewer = new Date()
            }
            if ((criteria.postsCount ?? 0) >= 1 && !unlocked.social_first_post) {
                newUnlocks.social_first_post = new Date()
            }
            if ((criteria.maxLikes ?? 0) >= 10 && !unlocked.social_popular) {
                newUnlocks.social_popular = new Date()
            }

            // If any new unlocks, update state and save
            const newIds = Object.keys(newUnlocks) as AchievementId[]
            if (newIds.length > 0) {
                const updated = { ...unlocked, ...newUnlocks }
                set({ unlocked: updated })

                // Show first new unlock as pending
                const firstUnlock = ACHIEVEMENTS.find(a => a.id === newIds[0])
                if (firstUnlock) {
                    set({ pendingUnlock: { ...firstUnlock, unlockedAt: newUnlocks[newIds[0]] } })
                    haptics.success()
                }

                // Persist
                AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
            }
        },

        loadAchievements: async () => {
            try {
                const saved = await AsyncStorage.getItem(STORAGE_KEY)
                if (saved) {
                    const parsed = JSON.parse(saved)
                    // Merge with defaults to handle new achievements
                    set({ unlocked: { ...getDefaultUnlocked(), ...parsed }, isLoaded: true })
                } else {
                    set({ isLoaded: true })
                }
            } catch {
                set({ isLoaded: true })
            }
        },

        dismissPending: () => set({ pendingUnlock: null }),

        getAll: () => {
            const { unlocked } = get()
            return ACHIEVEMENTS.map(a => ({
                ...a,
                unlocked: unlocked[a.id] !== null,
                unlockedAt: unlocked[a.id] || undefined,
            }))
        },

        getByCategory: (category) => {
            const { unlocked } = get()
            return ACHIEVEMENTS
                .filter(a => a.category === category)
                .map(a => ({
                    ...a,
                    unlocked: unlocked[a.id] !== null,
                    unlockedAt: unlocked[a.id] || undefined,
                }))
        },

        getCategoryProgress: (category) => {
            const { unlocked } = get()
            const categoryAchievements = ACHIEVEMENTS.filter(a => a.category === category)
            const unlockedCount = categoryAchievements.filter(a => unlocked[a.id] !== null).length
            return { unlocked: unlockedCount, total: categoryAchievements.length }
        },

        getProgress: (id, criteria) => {
            const achievement = ACHIEVEMENTS.find(a => a.id === id)
            if (!achievement?.target) return 0

            let current = 0
            switch (achievement.category) {
                case 'reading':
                    current = criteria.completedStories
                    break
                case 'streak':
                    current = criteria.streak
                    break
                case 'social':
                    if (id === 'social_popular') current = criteria.maxLikes ?? 0
                    else if (id === 'social_first_post') current = criteria.postsCount ?? 0
                    break
            }

            return Math.min(current / achievement.target, 1)
        },
    },
}))

// Export achievements list for external use
export const getAllAchievementDefinitions = () => ACHIEVEMENTS
export const getAchievementById = (id: AchievementId) => ACHIEVEMENTS.find(a => a.id === id)
