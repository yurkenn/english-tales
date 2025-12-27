/**
 * AdMob Service
 * Handles rewarded ad loading and displaying
 */

import mobileAds, {
    RewardedAd,
    RewardedAdEventType,
    AdEventType,
} from 'react-native-google-mobile-ads'
import { AD_UNIT_IDS, REWARD_CONFIG, RewardType } from './adConfig'
import { analyticsService } from '../firebase/analytics'

type AdLoadCallback = () => void
type AdEarnedCallback = (amount: number, type: string) => void
type AdErrorCallback = (error: Error) => void
type AdClosedCallback = (rewarded: boolean) => void

interface AdCallbacks {
    onLoaded?: AdLoadCallback
    onEarned?: AdEarnedCallback
    onError?: AdErrorCallback
    onClosed?: AdClosedCallback
}

class AdService {
    private rewardedAds: Map<string, RewardedAd> = new Map()
    private isInitialized = false
    private lastAdTime: number = 0

    /**
     * Initialize Mobile Ads SDK
     * Should be called once at app startup
     */
    async initialize(): Promise<boolean> {
        if (this.isInitialized) return true

        try {
            await mobileAds().initialize()
            this.isInitialized = true
            console.log('[AdService] Mobile Ads SDK initialized')

            // Preload ads
            this.preloadAd('story_unlock')
            this.preloadAd('translation')

            return true
        } catch (error) {
            console.error('[AdService] Failed to initialize:', error)
            return false
        }
    }

    /**
     * Get ad unit ID for reward type
     */
    private getAdUnitId(rewardType: RewardType): string {
        switch (rewardType) {
            case 'story_unlock':
                return AD_UNIT_IDS.REWARDED_STORY_UNLOCK
            case 'translation':
                return AD_UNIT_IDS.REWARDED_TRANSLATION
            case 'streak_protector':
                return AD_UNIT_IDS.REWARDED_STREAK_PROTECTOR
            default:
                return AD_UNIT_IDS.REWARDED_STORY_UNLOCK
        }
    }

    /**
     * Preload a rewarded ad
     */
    preloadAd(rewardType: RewardType): void {
        const adUnitId = this.getAdUnitId(rewardType)

        if (this.rewardedAds.has(rewardType)) {
            return // Already loaded or loading
        }

        const rewarded = RewardedAd.createForAdRequest(adUnitId, {
            requestNonPersonalizedAdsOnly: false,
        })

        rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
            console.log(`[AdService] ${rewardType} ad loaded`)
        })

        rewarded.addAdEventListener(AdEventType.ERROR, (error) => {
            console.error(`[AdService] ${rewardType} ad error:`, error)
            this.rewardedAds.delete(rewardType)
        })

        this.rewardedAds.set(rewardType, rewarded)
        rewarded.load()
    }

    /**
     * Check if ad is ready to show
     */
    isAdReady(rewardType: RewardType): boolean {
        const ad = this.rewardedAds.get(rewardType)
        return ad?.loaded ?? false
    }

    /**
     * Check if cooldown has passed
     */
    canShowAd(): boolean {
        const now = Date.now()
        const cooldownMs = REWARD_CONFIG.AD_COOLDOWN_SECONDS * 1000
        return now - this.lastAdTime >= cooldownMs
    }

    /**
     * Show a rewarded ad
     */
    async showRewardedAd(
        rewardType: RewardType,
        callbacks: AdCallbacks = {}
    ): Promise<boolean> {
        if (!this.canShowAd()) {
            callbacks.onError?.(new Error('Ad cooldown not passed'))
            return false
        }

        const ad = this.rewardedAds.get(rewardType)

        if (!ad || !ad.loaded) {
            callbacks.onError?.(new Error('Ad not ready'))
            // Try to reload
            this.preloadAd(rewardType)
            return false
        }

        return new Promise((resolve) => {
            let rewarded = false

            const earnedUnsubscribe = ad.addAdEventListener(
                RewardedAdEventType.EARNED_REWARD,
                (reward) => {
                    console.log(`[AdService] Reward earned: ${reward.amount} ${reward.type}`)
                    rewarded = true
                    callbacks.onEarned?.(reward.amount, reward.type)

                    // Track analytics
                    analyticsService.logEvent('ad_reward_earned', {
                        reward_type: rewardType,
                        reward_amount: reward.amount,
                    })
                }
            )

            const closedUnsubscribe = ad.addAdEventListener(
                AdEventType.CLOSED,
                () => {
                    console.log(`[AdService] Ad closed, rewarded: ${rewarded}`)

                    // Cleanup
                    earnedUnsubscribe()
                    closedUnsubscribe()
                    this.rewardedAds.delete(rewardType)

                    // Update last ad time
                    this.lastAdTime = Date.now()

                    // Preload next ad
                    this.preloadAd(rewardType)

                    callbacks.onClosed?.(rewarded)

                    // Track analytics
                    analyticsService.logEvent(rewarded ? 'ad_completed' : 'ad_skipped', {
                        reward_type: rewardType,
                    })

                    resolve(rewarded)
                }
            )

            // Track impression
            analyticsService.logEvent('ad_impression', {
                reward_type: rewardType,
            })

            ad.show()
        })
    }

    /**
     * Cleanup
     */
    destroy(): void {
        this.rewardedAds.forEach((ad) => {
            // Ads don't have a destroy method, just clear the map
        })
        this.rewardedAds.clear()
    }
}

export const adService = new AdService()
