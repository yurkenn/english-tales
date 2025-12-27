/**
 * Ad Store
 * Manages ad state and daily limits
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { REWARD_CONFIG } from '@/services/ads/adConfig'

// Helper to check if user should see ads (non-premium)
const shouldShowAds = () => {
    // Dynamic import to avoid circular dependencies
    const { useSubscriptionStore } = require('./subscriptionStore')
    return !useSubscriptionStore.getState().isPremium
}

interface AdState {
    isInitialized: boolean
    isAdLoading: boolean
    isAdReady: boolean
    dailyAdsWatched: number
    lastAdDate: string | null
    lastAdTimestamp: number
}

interface AdActions {
    setInitialized: (initialized: boolean) => void
    setAdLoading: (loading: boolean) => void
    setAdReady: (ready: boolean) => void
    incrementAdsWatched: () => void
    canWatchAd: () => boolean
    getRemainingAds: () => number
    resetDailyAds: () => void
}

const getToday = () => new Date().toISOString().split('T')[0]

const initialState: AdState = {
    isInitialized: false,
    isAdLoading: false,
    isAdReady: false,
    dailyAdsWatched: 0,
    lastAdDate: null,
    lastAdTimestamp: 0,
}

export const useAdStore = create<AdState & { actions: AdActions }>()(
    persist(
        (set, get) => ({
            ...initialState,
            actions: {
                setInitialized: (initialized) => set({ isInitialized: initialized }),

                setAdLoading: (loading) => set({ isAdLoading: loading }),

                setAdReady: (ready) => set({ isAdReady: ready }),

                incrementAdsWatched: () => {
                    const today = getToday()
                    const { lastAdDate, dailyAdsWatched } = get()

                    // Reset count if it's a new day
                    if (lastAdDate !== today) {
                        set({
                            dailyAdsWatched: 1,
                            lastAdDate: today,
                            lastAdTimestamp: Date.now(),
                        })
                    } else {
                        set({
                            dailyAdsWatched: dailyAdsWatched + 1,
                            lastAdTimestamp: Date.now(),
                        })
                    }
                },

                canWatchAd: () => {
                    const today = getToday()
                    const { lastAdDate, dailyAdsWatched, lastAdTimestamp } = get()

                    // Reset if new day
                    if (lastAdDate !== today) {
                        return true
                    }

                    // Check daily limit
                    if (dailyAdsWatched >= REWARD_CONFIG.MAX_DAILY_ADS) {
                        return false
                    }

                    // Check cooldown
                    const cooldownMs = REWARD_CONFIG.AD_COOLDOWN_SECONDS * 1000
                    if (Date.now() - lastAdTimestamp < cooldownMs) {
                        return false
                    }

                    return true
                },

                getRemainingAds: () => {
                    const today = getToday()
                    const { lastAdDate, dailyAdsWatched } = get()

                    if (lastAdDate !== today) {
                        return REWARD_CONFIG.MAX_DAILY_ADS
                    }

                    return Math.max(0, REWARD_CONFIG.MAX_DAILY_ADS - dailyAdsWatched)
                },

                resetDailyAds: () => {
                    set({
                        dailyAdsWatched: 0,
                        lastAdDate: getToday(),
                    })
                },
            },
        }),
        {
            name: 'ad-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                dailyAdsWatched: state.dailyAdsWatched,
                lastAdDate: state.lastAdDate,
                lastAdTimestamp: state.lastAdTimestamp,
            }),
        }
    )
)
