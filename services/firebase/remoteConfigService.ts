/**
 * Remote Config Service - Firebase Remote Config for A/B Testing
 * Provides feature flags and experiment configuration
 * Gracefully falls back to defaults if native module is not available
 */

// Default config values
const DEFAULT_CONFIG = {
    // Paywall configuration
    paywall_variant: 'default',
    onboarding_show_paywall: true,
    paywall_free_trial_days: 7,

    // Content gating
    free_stories_limit: 5,
    daily_ad_limit: 3,
    stories_before_paywall: 3,

    // Feature flags
    feature_referral_enabled: true,
    feature_social_sharing_enabled: true,
    feature_daily_bonus_enabled: true,
    feature_streak_protection_enabled: true,
    feature_vocabulary_quiz_enabled: true,
    feature_user_stories_enabled: true,

    // Onboarding configuration
    onboarding_steps: 'welcome,track,connect,interests,goal,level,notifications',
    onboarding_skip_enabled: true,

    // Engagement settings
    rating_prompt_stories_threshold: 3,
    rating_prompt_streak_threshold: 7,
    streak_reminder_hour: 19,

    // Monetization
    show_interstitial_after_stories: 2,
    rewarded_ad_cooldown_minutes: 5,
};

export type RemoteConfigKey = keyof typeof DEFAULT_CONFIG;
export type RemoteConfigValues = typeof DEFAULT_CONFIG;

class RemoteConfigService {
    private isInitialized = false;
    private cachedValues: RemoteConfigValues = { ...DEFAULT_CONFIG };
    private isNativeModuleAvailable = false;

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            // Try to dynamically require the native module
            const remoteConfigModule = require('@react-native-firebase/remote-config');

            // Check if the native module is actually available
            const remoteConfig = remoteConfigModule.default();

            // If we get here, the module exists - try to use it
            await remoteConfig.setDefaults(DEFAULT_CONFIG as Record<string, string | number | boolean>);
            await remoteConfig.setConfigSettings({
                minimumFetchIntervalMillis: __DEV__ ? 0 : 3600000,
            });

            // Fetch and activate
            const activated = await remoteConfig.fetchAndActivate();
            console.log('[RemoteConfig] Fetched and activated:', activated);

            // Cache all values
            const allValues = remoteConfig.getAll();
            this.cacheValuesFromNative(allValues);

            this.isNativeModuleAvailable = true;
            this.isInitialized = true;
            console.log('[RemoteConfig] Initialized successfully');
        } catch (error: unknown) {
            // Native module not available or failed
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.log('[RemoteConfig] Using default values:', errorMessage.substring(0, 100));
            this.isNativeModuleAvailable = false;
            this.isInitialized = true;
        }
    }

    private cacheValuesFromNative(allValues: Record<string, { asBoolean: () => boolean; asNumber: () => number; asString: () => string }>): void {
        try {
            for (const key of Object.keys(DEFAULT_CONFIG) as RemoteConfigKey[]) {
                const value = allValues[key];
                if (value) {
                    const defaultValue = DEFAULT_CONFIG[key];
                    if (typeof defaultValue === 'boolean') {
                        (this.cachedValues as Record<string, unknown>)[key] = value.asBoolean();
                    } else if (typeof defaultValue === 'number') {
                        (this.cachedValues as Record<string, unknown>)[key] = value.asNumber();
                    } else {
                        (this.cachedValues as Record<string, unknown>)[key] = value.asString();
                    }
                }
            }
        } catch (error) {
            console.warn('[RemoteConfig] Failed to cache values:', error);
        }
    }

    getString(key: RemoteConfigKey): string {
        const value = this.cachedValues[key];
        return typeof value === 'string' ? value : String(value);
    }

    getNumber(key: RemoteConfigKey): number {
        const value = this.cachedValues[key];
        return typeof value === 'number' ? value : Number(value);
    }

    getBoolean(key: RemoteConfigKey): boolean {
        const value = this.cachedValues[key];
        return typeof value === 'boolean' ? value : Boolean(value);
    }

    getAllValues(): RemoteConfigValues {
        return { ...this.cachedValues };
    }

    // Convenience getters for common configs
    get paywallVariant(): string {
        return this.getString('paywall_variant');
    }

    get shouldShowOnboardingPaywall(): boolean {
        return this.getBoolean('onboarding_show_paywall');
    }

    get freeStoriesLimit(): number {
        return this.getNumber('free_stories_limit');
    }

    get isReferralEnabled(): boolean {
        return this.getBoolean('feature_referral_enabled');
    }

    get isSocialSharingEnabled(): boolean {
        return this.getBoolean('feature_social_sharing_enabled');
    }

    get isDailyBonusEnabled(): boolean {
        return this.getBoolean('feature_daily_bonus_enabled');
    }

    get isStreakProtectionEnabled(): boolean {
        return this.getBoolean('feature_streak_protection_enabled');
    }

    get ratingStoriesThreshold(): number {
        return this.getNumber('rating_prompt_stories_threshold');
    }

    get ratingStreakThreshold(): number {
        return this.getNumber('rating_prompt_streak_threshold');
    }

    get onboardingSteps(): string[] {
        return this.getString('onboarding_steps').split(',');
    }

    // Force refresh (useful after user actions)
    async refresh(): Promise<void> {
        if (!this.isNativeModuleAvailable) return;

        try {
            const remoteConfigModule = require('@react-native-firebase/remote-config');
            const remoteConfig = remoteConfigModule.default();
            await remoteConfig.fetchAndActivate();
            const allValues = remoteConfig.getAll();
            this.cacheValuesFromNative(allValues);
        } catch (error) {
            console.warn('[RemoteConfig] Refresh failed:', error);
        }
    }
}

export const remoteConfigService = new RemoteConfigService();
