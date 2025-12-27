/**
 * Story Gating Service
 * Manages story access control: free, locked, premium-only
 */

import { useSubscriptionStore } from '@/store/subscriptionStore'
import { useRewardStore } from '@/store/rewardStore'
import { useCoinStore, COIN_COSTS } from '@/store/coinStore'

// Number of free stories before gating kicks in
const FREE_STORY_COUNT = 2

// Stories that are always free (can be story IDs or a count-based system)
const ALWAYS_FREE_STORY_IDS: string[] = []

export type GatingStatus = 'free' | 'unlocked' | 'locked' | 'premium_only'

export interface StoryGatingResult {
    status: GatingStatus
    canAccess: boolean
    unlockOptions: UnlockOption[]
    expiresAt?: number // For temporary unlocks
}

export interface UnlockOption {
    type: 'ad' | 'coins' | 'premium'
    label: string
    cost?: number
    available: boolean
}

/**
 * Check if a story is accessible to the user
 */
export function checkStoryAccess(
    storyId: string,
    storyIndex: number, // Position in list (0-indexed)
    isPremiumStory: boolean = false
): StoryGatingResult {
    const subscriptionState = useSubscriptionStore.getState()
    const rewardState = useRewardStore.getState()
    const coinState = useCoinStore.getState()

    // Premium users have full access
    if (subscriptionState.isPremium) {
        return {
            status: 'free',
            canAccess: true,
            unlockOptions: [],
        }
    }

    // Check if story is always free
    if (ALWAYS_FREE_STORY_IDS.includes(storyId)) {
        return {
            status: 'free',
            canAccess: true,
            unlockOptions: [],
        }
    }

    // First N stories are free
    if (storyIndex < FREE_STORY_COUNT) {
        return {
            status: 'free',
            canAccess: true,
            unlockOptions: [],
        }
    }

    // Check if story was already unlocked via rewards
    if (rewardState.actions.isStoryUnlocked(storyId)) {
        const unlocked = rewardState.unlockedStories.find(s => s.storyId === storyId)
        return {
            status: 'unlocked',
            canAccess: true,
            unlockOptions: [],
            expiresAt: unlocked?.expiresAt,
        }
    }

    // Story is locked - provide unlock options
    let unlockOptions: UnlockOption[] = []

    if (isPremiumStory) {
        unlockOptions = [
            {
                type: 'premium',
                label: 'Go Premium',
                available: true,
            },
        ]
    } else {
        unlockOptions = [
            {
                type: 'ad',
                label: 'Watch Ad',
                available: true, // Ad availability checked elsewhere
            },
            {
                type: 'coins',
                label: `${COIN_COSTS.UNLOCK_STORY_24H} Coins`,
                cost: COIN_COSTS.UNLOCK_STORY_24H,
                available: coinState.balance >= COIN_COSTS.UNLOCK_STORY_24H,
            },
            {
                type: 'premium',
                label: 'Go Premium',
                available: true,
            },
        ]
    }

    return {
        status: isPremiumStory ? 'premium_only' : 'locked',
        canAccess: false,
        unlockOptions,
    }
}

/**
 * Unlock a story using coins
 */
export function unlockStoryWithCoins(storyId: string): boolean {
    const coinActions = useCoinStore.getState().actions
    const rewardActions = useRewardStore.getState().actions

    if (!coinActions.canAfford(COIN_COSTS.UNLOCK_STORY_24H)) {
        return false
    }

    const success = coinActions.buyStoryUnlock()
    if (success) {
        rewardActions.unlockStory(storyId)
        return true
    }

    return false
}

/**
 * Unlock a story after watching ad (called from reward callback)
 */
export function unlockStoryWithAd(storyId: string): void {
    const rewardActions = useRewardStore.getState().actions
    rewardActions.unlockStory(storyId)
}

/**
 * Get remaining time for a temporary unlock
 */
export function getUnlockRemainingTime(storyId: string): number | null {
    const rewardState = useRewardStore.getState()
    const unlocked = rewardState.unlockedStories.find(s => s.storyId === storyId)

    if (!unlocked) return null

    const remaining = unlocked.expiresAt - Date.now()
    return remaining > 0 ? remaining : null
}

/**
 * Format remaining time for display
 */
export function formatRemainingTime(ms: number): string {
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) {
        return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
}
