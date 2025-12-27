/**
 * Reward Store
 * Manages user rewards earned from watching ads
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { REWARD_CONFIG } from '@/services/ads/adConfig'

interface UnlockedStory {
    storyId: string
    unlockedAt: number
    expiresAt: number
}

interface RewardState {
    // Translation rewards
    extraTranslations: number
    dailyTranslationsUsed: number
    lastTranslationDate: string | null

    // Story unlocks
    unlockedStories: UnlockedStory[]

    // Streak protector
    streakProtectorAvailable: boolean

    // Premium trial
    premiumTrialEndsAt: number | null
}

interface RewardActions {
    // Translation
    addTranslations: (count: number) => void
    useTranslation: () => boolean
    getRemainingTranslations: () => number
    canTranslate: () => boolean
    resetDailyTranslations: () => void

    // Story unlock
    unlockStory: (storyId: string) => void
    isStoryUnlocked: (storyId: string) => boolean
    cleanupExpiredUnlocks: () => void

    // Streak protector
    grantStreakProtector: () => void
    useStreakProtector: () => boolean

    // Premium trial
    grantPremiumTrial: (hours: number) => void
    isPremiumTrialActive: () => boolean

    // Reset
    clearRewards: () => void
}

const getToday = () => new Date().toISOString().split('T')[0]

const initialState: RewardState = {
    extraTranslations: 0,
    dailyTranslationsUsed: 0,
    lastTranslationDate: null,
    unlockedStories: [],
    streakProtectorAvailable: false,
    premiumTrialEndsAt: null,
}

export const useRewardStore = create<RewardState & { actions: RewardActions }>()(
    persist(
        (set, get) => ({
            ...initialState,
            actions: {
                // Translation methods
                addTranslations: (count) => {
                    set((state) => ({
                        extraTranslations: state.extraTranslations + count,
                    }))
                },

                useTranslation: () => {
                    const today = getToday()
                    const { lastTranslationDate, dailyTranslationsUsed, extraTranslations } = get()

                    // Reset daily count if new day
                    if (lastTranslationDate !== today) {
                        set({
                            dailyTranslationsUsed: 1,
                            lastTranslationDate: today,
                        })
                        return true
                    }

                    // Check free translations
                    if (dailyTranslationsUsed < REWARD_CONFIG.DAILY_FREE_TRANSLATIONS) {
                        set({ dailyTranslationsUsed: dailyTranslationsUsed + 1 })
                        return true
                    }

                    // Use extra translations
                    if (extraTranslations > 0) {
                        set({ extraTranslations: extraTranslations - 1 })
                        return true
                    }

                    return false
                },

                getRemainingTranslations: () => {
                    const today = getToday()
                    const { lastTranslationDate, dailyTranslationsUsed, extraTranslations } = get()

                    if (lastTranslationDate !== today) {
                        return REWARD_CONFIG.DAILY_FREE_TRANSLATIONS + extraTranslations
                    }

                    const freeRemaining = Math.max(0, REWARD_CONFIG.DAILY_FREE_TRANSLATIONS - dailyTranslationsUsed)
                    return freeRemaining + extraTranslations
                },

                canTranslate: () => {
                    return get().actions.getRemainingTranslations() > 0
                },

                resetDailyTranslations: () => {
                    set({
                        dailyTranslationsUsed: 0,
                        lastTranslationDate: getToday(),
                    })
                },

                // Story unlock methods
                unlockStory: (storyId) => {
                    const now = Date.now()
                    const expiresAt = now + (REWARD_CONFIG.STORY_UNLOCK_DURATION_HOURS * 60 * 60 * 1000)

                    set((state) => ({
                        unlockedStories: [
                            ...state.unlockedStories.filter((s) => s.storyId !== storyId),
                            { storyId, unlockedAt: now, expiresAt },
                        ],
                    }))
                },

                isStoryUnlocked: (storyId) => {
                    const { unlockedStories } = get()
                    const story = unlockedStories.find((s) => s.storyId === storyId)

                    if (!story) return false

                    // Check if expired
                    if (Date.now() > story.expiresAt) {
                        // Cleanup expired
                        get().actions.cleanupExpiredUnlocks()
                        return false
                    }

                    return true
                },

                cleanupExpiredUnlocks: () => {
                    const now = Date.now()
                    set((state) => ({
                        unlockedStories: state.unlockedStories.filter((s) => s.expiresAt > now),
                    }))
                },

                // Streak protector methods
                grantStreakProtector: () => {
                    set({ streakProtectorAvailable: true })
                },

                useStreakProtector: () => {
                    const { streakProtectorAvailable } = get()
                    if (streakProtectorAvailable) {
                        set({ streakProtectorAvailable: false })
                        return true
                    }
                    return false
                },

                // Premium trial methods
                grantPremiumTrial: (hours) => {
                    const expiresAt = Date.now() + (hours * 60 * 60 * 1000)
                    set({ premiumTrialEndsAt: expiresAt })
                },

                isPremiumTrialActive: () => {
                    const { premiumTrialEndsAt } = get()
                    if (!premiumTrialEndsAt) return false
                    return Date.now() < premiumTrialEndsAt
                },

                // Reset
                clearRewards: () => {
                    set(initialState)
                },
            },
        }),
        {
            name: 'reward-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                extraTranslations: state.extraTranslations,
                dailyTranslationsUsed: state.dailyTranslationsUsed,
                lastTranslationDate: state.lastTranslationDate,
                unlockedStories: state.unlockedStories,
                streakProtectorAvailable: state.streakProtectorAvailable,
                premiumTrialEndsAt: state.premiumTrialEndsAt,
            }),
        }
    )
)
