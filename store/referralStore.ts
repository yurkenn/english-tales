/**
 * Referral Store - Zustand store for referral system
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { referralService, ReferralStats, ReferralRecord } from '@/services/referralService';
import { Share } from 'react-native';
import { analyticsService } from '@/services/firebase/analytics';

interface ReferralState {
    referralCode: string | null;
    stats: ReferralStats | null;
    recentReferrals: ReferralRecord[];
    isLoading: boolean;
    error: string | null;
    appliedReferralCode: string | null;
}

interface ReferralActions {
    initialize: (userId: string) => Promise<void>;
    generateCode: (userId: string) => Promise<string>;
    shareReferralLink: () => Promise<void>;
    applyCode: (userId: string, code: string) => Promise<boolean>;
    refreshStats: (userId: string) => Promise<void>;
    completeReferral: (userId: string) => Promise<void>;
}

const initialState: ReferralState = {
    referralCode: null,
    stats: null,
    recentReferrals: [],
    isLoading: false,
    error: null,
    appliedReferralCode: null,
};

export const useReferralStore = create<ReferralState & { actions: ReferralActions }>()(
    persist(
        (set, get) => ({
            ...initialState,

            actions: {
                initialize: async (userId) => {
                    set({ isLoading: true, error: null });
                    try {
                        // Get or generate referral code
                        const code = await referralService.generateReferralCode(userId);

                        // Fetch stats
                        const stats = await referralService.getReferralStats(userId);

                        // Fetch recent referrals
                        const recentReferrals = await referralService.getRecentReferrals(userId, 5);

                        set({
                            referralCode: code,
                            stats,
                            recentReferrals,
                            isLoading: false,
                        });
                    } catch (error) {
                        const message = error instanceof Error ? error.message : 'Failed to initialize referrals';
                        set({ isLoading: false, error: message });
                    }
                },

                generateCode: async (userId) => {
                    const code = await referralService.generateReferralCode(userId);
                    set({ referralCode: code });
                    return code;
                },

                shareReferralLink: async () => {
                    const { referralCode } = get();
                    if (!referralCode) return;

                    try {
                        const link = referralService.getReferralLink(referralCode);

                        await Share.share({
                            message: `Join me on English Tales! Use my code ${referralCode} to get free bonus coins. 📚\n\n${link}`,
                            url: link,
                            title: 'Join English Tales',
                        });

                        await analyticsService.logReferralLinkShared();
                    } catch (error) {
                        console.error('[ReferralStore] Share failed:', error);
                    }
                },

                applyCode: async (userId, code) => {
                    set({ isLoading: true, error: null });
                    try {
                        const success = await referralService.applyReferral(userId, code);

                        if (success) {
                            set({
                                appliedReferralCode: code.toUpperCase(),
                                isLoading: false,
                            });
                        } else {
                            set({
                                isLoading: false,
                                error: 'Invalid or expired referral code',
                            });
                        }

                        return success;
                    } catch (error) {
                        const message = error instanceof Error ? error.message : 'Failed to apply code';
                        set({ isLoading: false, error: message });
                        return false;
                    }
                },

                refreshStats: async (userId) => {
                    try {
                        const stats = await referralService.getReferralStats(userId);
                        const recentReferrals = await referralService.getRecentReferrals(userId, 5);
                        set({ stats, recentReferrals });
                    } catch (error) {
                        console.error('[ReferralStore] Refresh stats failed:', error);
                    }
                },

                completeReferral: async (userId) => {
                    try {
                        await referralService.completeReferral(userId);
                    } catch (error) {
                        console.error('[ReferralStore] Complete referral failed:', error);
                    }
                },
            },
        }),
        {
            name: 'referral-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                referralCode: state.referralCode,
                appliedReferralCode: state.appliedReferralCode,
            }),
        }
    )
);

// Selector hooks
export const useReferralCode = () => useReferralStore((s) => s.referralCode);
export const useReferralStats = () => useReferralStore((s) => s.stats);
export const useReferralActions = () => useReferralStore((s) => s.actions);
