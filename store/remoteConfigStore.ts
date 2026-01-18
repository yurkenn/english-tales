/**
 * Remote Config Store - Zustand store for Firebase Remote Config
 */
import { create } from 'zustand';
import { remoteConfigService, RemoteConfigValues } from '@/services/firebase/remoteConfigService';

interface RemoteConfigState {
    isInitialized: boolean;
    isLoading: boolean;
    values: RemoteConfigValues | null;
}

interface RemoteConfigActions {
    initialize: () => Promise<void>;
    refresh: () => Promise<void>;
    getString: (key: keyof RemoteConfigValues) => string;
    getNumber: (key: keyof RemoteConfigValues) => number;
    getBoolean: (key: keyof RemoteConfigValues) => boolean;
}

const initialState: RemoteConfigState = {
    isInitialized: false,
    isLoading: false,
    values: null,
};

export const useRemoteConfigStore = create<RemoteConfigState & { actions: RemoteConfigActions }>()((set, get) => ({
    ...initialState,

    actions: {
        initialize: async () => {
            if (get().isInitialized) return;

            set({ isLoading: true });
            try {
                await remoteConfigService.initialize();
                set({
                    isInitialized: true,
                    isLoading: false,
                    values: remoteConfigService.getAllValues(),
                });
            } catch (error) {
                console.warn('[RemoteConfigStore] Init failed:', error);
                set({ isLoading: false, isInitialized: true });
            }
        },

        refresh: async () => {
            set({ isLoading: true });
            try {
                await remoteConfigService.refresh();
                set({
                    isLoading: false,
                    values: remoteConfigService.getAllValues(),
                });
            } catch (error) {
                console.warn('[RemoteConfigStore] Refresh failed:', error);
                set({ isLoading: false });
            }
        },

        getString: (key) => remoteConfigService.getString(key),
        getNumber: (key) => remoteConfigService.getNumber(key),
        getBoolean: (key) => remoteConfigService.getBoolean(key),
    },
}));

// Selector hooks for common flags
export const useIsReferralEnabled = () => useRemoteConfigStore((s) => s.values?.feature_referral_enabled ?? true);
export const useIsSocialSharingEnabled = () => useRemoteConfigStore((s) => s.values?.feature_social_sharing_enabled ?? true);
export const usePaywallVariant = () => useRemoteConfigStore((s) => s.values?.paywall_variant ?? 'default');
export const useFreeStoriesLimit = () => useRemoteConfigStore((s) => s.values?.free_stories_limit ?? 5);
