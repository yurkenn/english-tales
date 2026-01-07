/**
 * AdMob Configuration
 * Contains ad unit IDs and reward configuration
 */

// AdMob App ID: ca-app-pub-6012481599277383~8771515308

import { TestIds } from 'react-native-google-mobile-ads'
import { Platform } from 'react-native'

export const AD_UNIT_IDS = {
    // Production Ad Unit IDs (create these in AdMob console)
    REWARDED_STORY_UNLOCK: __DEV__
        ? TestIds.REWARDED
        : 'ca-app-pub-6012481599277383/6069329647', // Production ID from screenshot

    REWARDED_TRANSLATION: __DEV__
        ? TestIds.REWARDED
        : Platform.select({
            ios: 'ca-app-pub-6012481599277383/XXXXXXXXXX',
            android: 'ca-app-pub-6012481599277383/XXXXXXXXXX',
            default: 'ca-app-pub-6012481599277383/XXXXXXXXXX',
        }),

    REWARDED_STREAK_PROTECTOR: __DEV__
        ? TestIds.REWARDED
        : Platform.select({
            ios: 'ca-app-pub-6012481599277383/XXXXXXXXXX',
            android: 'ca-app-pub-6012481599277383/XXXXXXXXXX',
            default: 'ca-app-pub-6012481599277383/XXXXXXXXXX',
        }),
}

export const REWARD_CONFIG = {
    // Translation limits
    DAILY_FREE_TRANSLATIONS: 5,
    TRANSLATIONS_PER_AD: 10,

    // Story unlock duration
    STORY_UNLOCK_DURATION_HOURS: 24,

    // Daily ad limits
    MAX_DAILY_ADS: 10,

    // Cooldown between ads (in seconds)
    AD_COOLDOWN_SECONDS: 30,
}

export type RewardType =
    | 'story_unlock'
    | 'translation'
    | 'streak_protector'
    | 'premium_trial'
