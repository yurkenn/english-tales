/**
 * useRewardedAd Hook
 * Simplified interface for showing rewarded ads
 */

import { useState, useCallback, useEffect } from 'react'
import { adService, RewardType, REWARD_CONFIG } from '@/services/ads'
import { useAdStore } from '@/store/adStore'
import { useRewardStore } from '@/store/rewardStore'
import { useCoinStore } from '@/store/coinStore'
import { haptics } from '@/utils/haptics'

interface UseRewardedAdOptions {
    rewardType: RewardType
    onRewardEarned?: () => void
    onError?: (error: string) => void
}

interface UseRewardedAdReturn {
    showAd: () => Promise<boolean>
    isLoading: boolean
    isReady: boolean
    canWatch: boolean
    remainingAds: number
}

export function useRewardedAd(options: UseRewardedAdOptions): UseRewardedAdReturn {
    const { rewardType, onRewardEarned, onError } = options

    const [isLoading, setIsLoading] = useState(false)
    const [isReady, setIsReady] = useState(false)

    const adActions = useAdStore((state) => state.actions)
    const rewardActions = useRewardStore((state) => state.actions)
    const canWatch = useAdStore((state) => state.actions.canWatchAd())
    const remainingAds = useAdStore((state) => state.actions.getRemainingAds())

    // Check ad readiness
    useEffect(() => {
        const checkReady = () => {
            setIsReady(adService.isAdReady(rewardType))
        }

        checkReady()
        const interval = setInterval(checkReady, 1000)

        return () => clearInterval(interval)
    }, [rewardType])

    const applyReward = useCallback(() => {
        // Always earn coins when watching ads
        useCoinStore.getState().actions.earnFromAd()

        switch (rewardType) {
            case 'translation':
                rewardActions.addTranslations(REWARD_CONFIG.TRANSLATIONS_PER_AD)
                break
            case 'streak_protector':
                rewardActions.grantStreakProtector()
                break
            case 'premium_trial':
                rewardActions.grantPremiumTrial(24) // 24 hour trial
                break
            // story_unlock is handled separately with storyId
        }
    }, [rewardType, rewardActions])

    const showAd = useCallback(async (): Promise<boolean> => {
        if (!canWatch) {
            onError?.('Daily ad limit reached')
            return false
        }

        if (!isReady) {
            onError?.('Ad not ready. Please try again.')
            // Try to preload
            adService.preloadAd(rewardType)
            return false
        }

        setIsLoading(true)
        haptics.selection()

        try {
            const rewarded = await adService.showRewardedAd(rewardType, {
                onEarned: () => {
                    haptics.success()
                    adActions.incrementAdsWatched()
                    applyReward()
                    onRewardEarned?.()
                },
                onError: (error) => {
                    haptics.error()
                    onError?.(error.message)
                },
            })

            setIsLoading(false)
            return rewarded
        } catch (error) {
            setIsLoading(false)
            onError?.('Failed to show ad')
            return false
        }
    }, [canWatch, isReady, rewardType, adActions, applyReward, onRewardEarned, onError])

    return {
        showAd,
        isLoading,
        isReady,
        canWatch,
        remainingAds,
    }
}

/**
 * Hook specifically for unlocking stories
 */
export function useStoryUnlockAd(storyId: string) {
    const rewardActions = useRewardStore((state) => state.actions)
    const isUnlocked = useRewardStore((state) => state.actions.isStoryUnlocked(storyId))

    const { showAd, isLoading, isReady, canWatch, remainingAds } = useRewardedAd({
        rewardType: 'story_unlock',
        onRewardEarned: () => {
            rewardActions.unlockStory(storyId)
        },
    })

    return {
        showAd,
        isLoading,
        isReady,
        canWatch,
        remainingAds,
        isUnlocked,
    }
}
