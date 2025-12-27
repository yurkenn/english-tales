/**
 * Coin Store
 * Manages in-app currency for rewards and purchases
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from '@react-native-firebase/firestore'

const db = getFirestore()

// Coin earning amounts
export const COIN_REWARDS = {
    WATCH_AD: 50,
    COMPLETE_STORY: 20,
    QUIZ_PERFECT: 30,
    DAILY_GOAL: 100,
    STREAK_7_DAYS: 500,
    STREAK_30_DAYS: 2000,
} as const

// Coin spending costs
export const COIN_COSTS = {
    TRANSLATIONS_5: 50,
    UNLOCK_STORY_24H: 100,
    STREAK_PROTECTOR: 200,
    PREMIUM_TRIAL_1H: 300,
} as const

interface CoinTransaction {
    id: string
    type: 'earn' | 'spend'
    amount: number
    reason: keyof typeof COIN_REWARDS | keyof typeof COIN_COSTS | string
    timestamp: number
}

interface CoinState {
    balance: number
    totalEarned: number
    totalSpent: number
    lastSyncAt: number | null
    transactions: CoinTransaction[]
    userId: string | null
}

interface CoinActions {
    setUserId: (userId: string | null) => void

    // Earning
    earnCoins: (amount: number, reason: string) => void
    earnFromAd: () => void
    earnFromStoryComplete: () => void
    earnFromQuizPerfect: () => void
    earnFromDailyGoal: () => void
    earnFromStreak: (days: number) => void

    // Spending
    spendCoins: (amount: number, reason: string) => boolean
    canAfford: (amount: number) => boolean
    buyTranslations: () => boolean
    buyStoryUnlock: () => boolean
    buyStreakProtector: () => boolean
    buyPremiumTrial: () => boolean

    // Sync
    syncWithFirebase: () => Promise<void>
    fetchFromFirebase: () => Promise<void>

    // Reset
    clearCoins: () => void
}

const generateTransactionId = () => `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

const initialState: CoinState = {
    balance: 0,
    totalEarned: 0,
    totalSpent: 0,
    lastSyncAt: null,
    transactions: [],
    userId: null,
}

export const useCoinStore = create<CoinState & { actions: CoinActions }>()(
    persist(
        (set, get) => ({
            ...initialState,
            actions: {
                setUserId: (userId) => {
                    set({ userId })
                    if (userId) {
                        get().actions.fetchFromFirebase()
                    } else {
                        set(initialState)
                    }
                },

                // Generic earn
                earnCoins: (amount, reason) => {
                    const transaction: CoinTransaction = {
                        id: generateTransactionId(),
                        type: 'earn',
                        amount,
                        reason,
                        timestamp: Date.now(),
                    }

                    set((state) => ({
                        balance: state.balance + amount,
                        totalEarned: state.totalEarned + amount,
                        transactions: [transaction, ...state.transactions.slice(0, 49)], // Keep last 50
                    }))

                    // Sync after earning
                    get().actions.syncWithFirebase()
                },

                earnFromAd: () => {
                    get().actions.earnCoins(COIN_REWARDS.WATCH_AD, 'WATCH_AD')
                },

                earnFromStoryComplete: () => {
                    get().actions.earnCoins(COIN_REWARDS.COMPLETE_STORY, 'COMPLETE_STORY')
                },

                earnFromQuizPerfect: () => {
                    get().actions.earnCoins(COIN_REWARDS.QUIZ_PERFECT, 'QUIZ_PERFECT')
                },

                earnFromDailyGoal: () => {
                    get().actions.earnCoins(COIN_REWARDS.DAILY_GOAL, 'DAILY_GOAL')
                },

                earnFromStreak: (days) => {
                    if (days >= 30) {
                        get().actions.earnCoins(COIN_REWARDS.STREAK_30_DAYS, 'STREAK_30_DAYS')
                    } else if (days >= 7) {
                        get().actions.earnCoins(COIN_REWARDS.STREAK_7_DAYS, 'STREAK_7_DAYS')
                    }
                },

                // Generic spend
                spendCoins: (amount, reason) => {
                    const { balance } = get()
                    if (balance < amount) return false

                    const transaction: CoinTransaction = {
                        id: generateTransactionId(),
                        type: 'spend',
                        amount,
                        reason,
                        timestamp: Date.now(),
                    }

                    set((state) => ({
                        balance: state.balance - amount,
                        totalSpent: state.totalSpent + amount,
                        transactions: [transaction, ...state.transactions.slice(0, 49)],
                    }))

                    // Sync after spending
                    get().actions.syncWithFirebase()
                    return true
                },

                canAfford: (amount) => {
                    return get().balance >= amount
                },

                buyTranslations: () => {
                    return get().actions.spendCoins(COIN_COSTS.TRANSLATIONS_5, 'TRANSLATIONS_5')
                },

                buyStoryUnlock: () => {
                    return get().actions.spendCoins(COIN_COSTS.UNLOCK_STORY_24H, 'UNLOCK_STORY_24H')
                },

                buyStreakProtector: () => {
                    return get().actions.spendCoins(COIN_COSTS.STREAK_PROTECTOR, 'STREAK_PROTECTOR')
                },

                buyPremiumTrial: () => {
                    return get().actions.spendCoins(COIN_COSTS.PREMIUM_TRIAL_1H, 'PREMIUM_TRIAL_1H')
                },

                // Firebase sync
                syncWithFirebase: async () => {
                    const { userId, balance, totalEarned, totalSpent } = get()
                    if (!userId) return

                    try {
                        await setDoc(
                            doc(db, 'users', userId, 'wallet', 'coins'),
                            {
                                balance,
                                totalEarned,
                                totalSpent,
                                updatedAt: serverTimestamp(),
                            },
                            { merge: true }
                        )
                        set({ lastSyncAt: Date.now() })
                    } catch (error) {
                        console.warn('[CoinStore] Sync failed:', error)
                    }
                },

                fetchFromFirebase: async () => {
                    const { userId } = get()
                    if (!userId) return

                    try {
                        const docSnap = await getDoc(doc(db, 'users', userId, 'wallet', 'coins'))
                        if (docSnap.exists()) {
                            const data = docSnap.data()
                            set({
                                balance: data?.balance ?? 0,
                                totalEarned: data?.totalEarned ?? 0,
                                totalSpent: data?.totalSpent ?? 0,
                                lastSyncAt: Date.now(),
                            })
                        }
                    } catch (error) {
                        console.warn('[CoinStore] Fetch failed:', error)
                    }
                },

                clearCoins: () => {
                    set(initialState)
                },
            },
        }),
        {
            name: 'coin-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                balance: state.balance,
                totalEarned: state.totalEarned,
                totalSpent: state.totalSpent,
                transactions: state.transactions,
                lastSyncAt: state.lastSyncAt,
            }),
        }
    )
)
