/**
 * ReferralCard - Profile Section Referral Card
 */
import { FC, memo, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share } from 'react-native';
import { useTheme, Theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { haptics } from '@/utils/haptics';
import { useReferralStore, useReferralCode, useReferralStats } from '@/store/referralStore';
import { useAuthStore } from '@/store/authStore';
import { referralService } from '@/services/referralService';
import { useRouter } from 'expo-router';
import { analyticsService } from '@/services/firebase/analytics';

export const ReferralCard: FC = memo(() => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const router = useRouter();

    const user = useAuthStore((s) => s.user);
    const referralCode = useReferralCode();
    const stats = useReferralStats();
    const { actions } = useReferralStore();

    // Initialize referral when user is available
    useEffect(() => {
        if (user?.id && !referralCode) {
            actions.initialize(user.id);
        }
    }, [user?.id, referralCode, actions]);

    const handleShare = useCallback(async () => {
        if (!referralCode) return;

        haptics.selection();

        try {
            const link = referralService.getReferralLink(referralCode);

            await Share.share({
                message: `Join me on English Tales! Use my code ${referralCode} to get free bonus coins. 📚\n\n${link}`,
                url: link,
                title: 'Join English Tales',
            });

            await analyticsService.logReferralLinkShared();
        } catch (error) {
            console.error('[ReferralCard] Share failed:', error);
        }
    }, [referralCode]);

    const handleViewDetails = useCallback(() => {
        haptics.selection();
        router.push('/referral');
    }, [router]);

    if (!user || user.isAnonymous) {
        return null;
    }

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={handleViewDetails}
            activeOpacity={0.8}
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <Ionicons name="gift" size={24} color={theme.colors.warning} />
                </View>
                <View style={styles.headerText}>
                    <Text style={styles.title}>Invite Friends</Text>
                    <Text style={styles.subtitle}>Earn rewards for each friend who joins</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
            </View>

            {/* Stats Row */}
            {stats && stats.totalReferrals > 0 && (
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{stats.totalReferrals}</Text>
                        <Text style={styles.statLabel}>Invited</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{stats.successfulReferrals}</Text>
                        <Text style={styles.statLabel}>Joined</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: theme.colors.warning }]}>
                            {stats.rewardsEarned}
                        </Text>
                        <Text style={styles.statLabel}>Coins</Text>
                    </View>
                </View>
            )}

            {/* Referral Code */}
            {referralCode && (
                <View style={styles.codeSection}>
                    <View style={styles.codeContainer}>
                        <Text style={styles.codeLabel}>Your Code</Text>
                        <Text style={styles.codeValue}>{referralCode}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.shareButton}
                        onPress={handleShare}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="share-social" size={20} color="#FFFFFF" />
                        <Text style={styles.shareButtonText}>Share</Text>
                    </TouchableOpacity>
                </View>
            )}
        </TouchableOpacity>
    );
});

ReferralCard.displayName = 'ReferralCard';

function createStyles(theme: Theme) {
    return StyleSheet.create({
        container: {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.xl,
            padding: theme.spacing.lg,
            marginHorizontal: theme.spacing.lg,
            marginVertical: theme.spacing.sm,
            borderWidth: 1,
            borderColor: theme.colors.warning + '30',
            ...theme.shadows.sm,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.md,
        },
        iconContainer: {
            width: 48,
            height: 48,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.warning + '20',
            alignItems: 'center',
            justifyContent: 'center',
        },
        headerText: {
            flex: 1,
        },
        title: {
            fontSize: theme.typography.size.lg,
            fontWeight: 'bold',
            color: theme.colors.text,
        },
        subtitle: {
            fontSize: theme.typography.size.sm,
            color: theme.colors.textMuted,
            marginTop: 2,
        },
        statsRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-around',
            marginTop: theme.spacing.lg,
            paddingTop: theme.spacing.md,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
        },
        statItem: {
            alignItems: 'center',
        },
        statValue: {
            fontSize: theme.typography.size.xl,
            fontWeight: 'bold',
            color: theme.colors.text,
        },
        statLabel: {
            fontSize: theme.typography.size.xs,
            color: theme.colors.textMuted,
            marginTop: 2,
        },
        statDivider: {
            width: 1,
            height: 32,
            backgroundColor: theme.colors.border,
        },
        codeSection: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: theme.spacing.lg,
            paddingTop: theme.spacing.md,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            gap: theme.spacing.md,
        },
        codeContainer: {
            flex: 1,
        },
        codeLabel: {
            fontSize: theme.typography.size.xs,
            color: theme.colors.textMuted,
        },
        codeValue: {
            fontSize: theme.typography.size.xl,
            fontWeight: 'bold',
            color: theme.colors.primary,
            letterSpacing: 2,
        },
        shareButton: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.xs,
            backgroundColor: theme.colors.primary,
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.sm,
            borderRadius: theme.radius.full,
        },
        shareButtonText: {
            color: '#FFFFFF',
            fontSize: theme.typography.size.sm,
            fontWeight: 'bold',
        },
    });
}
