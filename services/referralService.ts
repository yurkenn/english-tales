/**
 * Referral Service - Handles referral code generation and tracking
 */
import {
    getFirestore,
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    increment,
} from '@react-native-firebase/firestore';
import { nanoid } from 'nanoid';
import { analyticsService } from './firebase/analytics';

const db = getFirestore();

export interface ReferralStats {
    totalReferrals: number;
    successfulReferrals: number;
    pendingReferrals: number;
    rewardsEarned: number;
}

export interface ReferralRecord {
    id: string;
    referrerId: string;
    referredUserId: string;
    referralCode: string;
    status: 'pending' | 'completed' | 'rewarded';
    createdAt: Date;
    completedAt?: Date;
    rewardedAt?: Date;
}

// Reward configuration
const REFERRAL_REWARDS = {
    REFERRER_PREMIUM_DAYS: 7,
    REFERRED_PREMIUM_DAYS: 3,
    REFERRER_COINS: 100,
    REFERRED_COINS: 50,
};

class ReferralService {
    /**
     * Generate a unique referral code for a user
     */
    async generateReferralCode(userId: string): Promise<string> {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData?.referralCode) {
                return userData.referralCode;
            }
        }

        // Generate new code (6 chars, uppercase alphanumeric)
        const code = nanoid(6).toUpperCase();

        // Save to user document
        await setDoc(userRef, { referralCode: code }, { merge: true });

        // Log analytics
        await analyticsService.logReferralLinkCreated(userId);

        return code;
    }

    /**
     * Get referral link for sharing
     */
    getReferralLink(referralCode: string): string {
        return `https://englishtales.app/invite/${referralCode}`;
    }

    /**
     * Get deep link for app
     */
    getDeepLink(referralCode: string): string {
        return `english-tales://invite/${referralCode}`;
    }

    /**
     * Validate a referral code
     */
    async validateReferralCode(code: string): Promise<{ valid: boolean; referrerId?: string }> {
        try {
            const q = query(
                collection(db, 'users'),
                where('referralCode', '==', code.toUpperCase()),
                limit(1)
            );
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                return { valid: false };
            }

            return {
                valid: true,
                referrerId: snapshot.docs[0].id,
            };
        } catch (error) {
            console.error('[ReferralService] Validation failed:', error);
            return { valid: false };
        }
    }

    /**
     * Apply referral when a new user signs up with a code
     */
    async applyReferral(referredUserId: string, referralCode: string): Promise<boolean> {
        try {
            const validation = await this.validateReferralCode(referralCode);
            if (!validation.valid || !validation.referrerId) {
                return false;
            }

            // Prevent self-referral
            if (validation.referrerId === referredUserId) {
                return false;
            }

            // Check if user already has a referrer
            const referredUserDoc = await getDoc(doc(db, 'users', referredUserId));
            if (referredUserDoc.exists() && referredUserDoc.data()?.referredBy) {
                return false; // Already referred
            }

            // Create referral record
            const referralRef = doc(collection(db, 'referrals'));
            await setDoc(referralRef, {
                id: referralRef.id,
                referrerId: validation.referrerId,
                referredUserId,
                referralCode: referralCode.toUpperCase(),
                status: 'pending',
                createdAt: serverTimestamp(),
            });

            // Update referred user
            await setDoc(doc(db, 'users', referredUserId), {
                referredBy: validation.referrerId,
                referralAppliedAt: serverTimestamp(),
            }, { merge: true });

            // Update referrer's referral count
            await updateDoc(doc(db, 'users', validation.referrerId), {
                referralCount: increment(1),
            });

            // Log analytics
            await analyticsService.logReferralJoined(referralCode);

            return true;
        } catch (error) {
            console.error('[ReferralService] Apply referral failed:', error);
            return false;
        }
    }

    /**
     * Complete referral (called when referred user completes onboarding or first story)
     */
    async completeReferral(referredUserId: string): Promise<void> {
        try {
            // Find pending referral
            const q = query(
                collection(db, 'referrals'),
                where('referredUserId', '==', referredUserId),
                where('status', '==', 'pending'),
                limit(1)
            );
            const snapshot = await getDocs(q);

            if (snapshot.empty) return;

            const referralDoc = snapshot.docs[0];
            const referralData = referralDoc.data();

            // Update status
            await updateDoc(referralDoc.ref, {
                status: 'completed',
                completedAt: serverTimestamp(),
            });

            // Grant rewards
            await this.grantRewards(referralData.referrerId, referredUserId);

            // Update status to rewarded
            await updateDoc(referralDoc.ref, {
                status: 'rewarded',
                rewardedAt: serverTimestamp(),
            });

            // Log analytics
            await analyticsService.logReferralRewardEarned('premium_days', referredUserId);
        } catch (error) {
            console.error('[ReferralService] Complete referral failed:', error);
        }
    }

    /**
     * Grant rewards to both parties
     */
    private async grantRewards(referrerId: string, referredUserId: string): Promise<void> {
        // This would integrate with your subscription/reward system
        // For now, we'll add coins and log the reward

        // Update referrer
        await updateDoc(doc(db, 'users', referrerId), {
            successfulReferrals: increment(1),
            bonusCoins: increment(REFERRAL_REWARDS.REFERRER_COINS),
        });

        // Update referred user
        await updateDoc(doc(db, 'users', referredUserId), {
            bonusCoins: increment(REFERRAL_REWARDS.REFERRED_COINS),
        });

        console.log('[ReferralService] Rewards granted:', {
            referrer: { coins: REFERRAL_REWARDS.REFERRER_COINS },
            referred: { coins: REFERRAL_REWARDS.REFERRED_COINS },
        });
    }

    /**
     * Get referral stats for a user
     */
    async getReferralStats(userId: string): Promise<ReferralStats> {
        try {
            const q = query(
                collection(db, 'referrals'),
                where('referrerId', '==', userId),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);

            let totalReferrals = 0;
            let successfulReferrals = 0;
            let pendingReferrals = 0;

            snapshot.docs.forEach((d: { data: () => { status: string } }) => {
                totalReferrals++;
                const status = d.data().status;
                if (status === 'rewarded' || status === 'completed') {
                    successfulReferrals++;
                } else if (status === 'pending') {
                    pendingReferrals++;
                }
            });

            return {
                totalReferrals,
                successfulReferrals,
                pendingReferrals,
                rewardsEarned: successfulReferrals * REFERRAL_REWARDS.REFERRER_COINS,
            };
        } catch (error) {
            console.error('[ReferralService] Get stats failed:', error);
            return {
                totalReferrals: 0,
                successfulReferrals: 0,
                pendingReferrals: 0,
                rewardsEarned: 0,
            };
        }
    }

    /**
     * Get recent referrals for a user
     */
    async getRecentReferrals(userId: string, count = 10): Promise<ReferralRecord[]> {
        try {
            const q = query(
                collection(db, 'referrals'),
                where('referrerId', '==', userId),
                orderBy('createdAt', 'desc'),
                limit(count)
            );
            const snapshot = await getDocs(q);

            return snapshot.docs.map((d: { id: string; data: () => Record<string, any> }) => {
                const data = d.data();
                return {
                    id: d.id,
                    referrerId: data.referrerId,
                    referredUserId: data.referredUserId,
                    referralCode: data.referralCode,
                    status: data.status,
                    createdAt: data.createdAt?.toDate?.() || new Date(),
                    completedAt: data.completedAt?.toDate?.(),
                    rewardedAt: data.rewardedAt?.toDate?.(),
                };
            });
        } catch (error) {
            console.error('[ReferralService] Get referrals failed:', error);
            return [];
        }
    }
}

export const referralService = new ReferralService();
