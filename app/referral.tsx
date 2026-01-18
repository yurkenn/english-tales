/**
 * Referral Screen - Full referral management
 */
import { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Share,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, Theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { haptics } from '@/utils/haptics';
import { useReferralStore, useReferralCode, useReferralStats } from '@/store/referralStore';
import { useAuthStore } from '@/store/authStore';
import { referralService, ReferralRecord } from '@/services/referralService';
import { analyticsService } from '@/services/firebase/analytics';
import { useTranslation } from 'react-i18next';

export default function ReferralScreen() {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { t } = useTranslation();

    const user = useAuthStore((s) => s.user);
    const referralCode = useReferralCode();
    const stats = useReferralStats();
    const { actions, isLoading } = useReferralStore();

    const [recentReferrals, setRecentReferrals] = useState<ReferralRecord[]>([]);
    const [enteredCode, setEnteredCode] = useState('');
    const [applyError, setApplyError] = useState<string | null>(null);
    const [isApplying, setIsApplying] = useState(false);

    useEffect(() => {
        if (user?.id) {
            actions.initialize(user.id);
            loadReferrals();
        }
    }, [user?.id, actions]);

    const loadReferrals = async () => {
        if (!user?.id) return;
        const referrals = await referralService.getRecentReferrals(user.id, 10);
        setRecentReferrals(referrals);
    };

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
            console.error('[ReferralScreen] Share failed:', error);
        }
    }, [referralCode]);

    const handleApplyCode = useCallback(async () => {
        if (!enteredCode.trim() || !user?.id) return;

        haptics.selection();
        setApplyError(null);
        setIsApplying(true);

        try {
            await analyticsService.logReferralCodeEntered(enteredCode.trim());
            const success = await actions.applyCode(user.id, enteredCode.trim());

            if (success) {
                haptics.success();
                setEnteredCode('');
            } else {
                setApplyError('Invalid or expired referral code');
                haptics.error();
            }
        } catch {
            setApplyError('Failed to apply code. Please try again.');
            haptics.error();
        } finally {
            setIsApplying(false);
        }
    }, [enteredCode, user?.id, actions]);

    const renderReferralItem = (referral: ReferralRecord, index: number) => {
        const statusColor = referral.status === 'rewarded'
            ? theme.colors.success
            : referral.status === 'completed'
                ? theme.colors.primary
                : theme.colors.textMuted;

        const statusIcon = referral.status === 'rewarded'
            ? 'checkmark-circle'
            : referral.status === 'completed'
                ? 'time'
                : 'hourglass';

        return (
            <View key={referral.id} style={styles.referralItem}>
                <View style={styles.referralInfo}>
                    <Text style={styles.referralUser}>Friend #{index + 1}</Text>
                    <Text style={styles.referralDate}>
                        {referral.createdAt.toLocaleDateString()}
                    </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                    <Ionicons name={statusIcon} size={14} color={statusColor} />
                    <Text style={[styles.statusText, { color: statusColor }]}>
                        {referral.status === 'rewarded' ? 'Rewarded' : referral.status === 'completed' ? 'Completed' : 'Pending'}
                    </Text>
                </View>
            </View>
        );
    };

    if (isLoading && !referralCode) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <>
            <Stack.Screen
                options={{
                    title: 'Invite Friends',
                    headerStyle: { backgroundColor: theme.colors.background },
                    headerTintColor: theme.colors.text,
                }}
            />
            <ScrollView
                style={styles.container}
                contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
            >
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <View style={styles.giftIcon}>
                        <Ionicons name="gift" size={48} color={theme.colors.warning} />
                    </View>
                    <Text style={styles.heroTitle}>Invite & Earn</Text>
                    <Text style={styles.heroSubtitle}>
                        Share your code with friends. When they join and complete their first story, you both earn rewards!
                    </Text>
                </View>

                {/* Your Code */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Your Referral Code</Text>
                    <View style={styles.codeCard}>
                        <Text style={styles.codeText}>{referralCode || '...'}</Text>
                        <TouchableOpacity
                            style={styles.copyButton}
                            onPress={handleShare}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="share-social" size={20} color="#FFFFFF" />
                            <Text style={styles.copyButtonText}>Share</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Rewards Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Rewards</Text>
                    <View style={styles.rewardsGrid}>
                        <View style={styles.rewardCard}>
                            <View style={[styles.rewardIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                                <Ionicons name="person-add" size={24} color={theme.colors.primary} />
                            </View>
                            <Text style={styles.rewardTitle}>You Get</Text>
                            <Text style={styles.rewardValue}>100 Coins</Text>
                        </View>
                        <View style={styles.rewardCard}>
                            <View style={[styles.rewardIcon, { backgroundColor: theme.colors.success + '20' }]}>
                                <Ionicons name="person" size={24} color={theme.colors.success} />
                            </View>
                            <Text style={styles.rewardTitle}>Friend Gets</Text>
                            <Text style={styles.rewardValue}>50 Coins</Text>
                        </View>
                    </View>
                </View>

                {/* Stats */}
                {stats && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Your Stats</Text>
                        <View style={styles.statsCard}>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{stats.totalReferrals}</Text>
                                <Text style={styles.statLabel}>Total Invited</Text>
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
                                <Text style={styles.statLabel}>Earned</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Enter a Code */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Have a Code?</Text>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter referral code"
                            placeholderTextColor={theme.colors.textMuted}
                            value={enteredCode}
                            onChangeText={setEnteredCode}
                            autoCapitalize="characters"
                            maxLength={6}
                        />
                        <TouchableOpacity
                            style={[styles.applyButton, !enteredCode.trim() && styles.applyButtonDisabled]}
                            onPress={handleApplyCode}
                            disabled={!enteredCode.trim() || isApplying}
                            activeOpacity={0.7}
                        >
                            {isApplying ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.applyButtonText}>Apply</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                    {applyError && (
                        <Text style={styles.errorText}>{applyError}</Text>
                    )}
                </View>

                {/* Recent Referrals */}
                {recentReferrals.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Recent Referrals</Text>
                        <View style={styles.referralsList}>
                            {recentReferrals.map(renderReferralItem)}
                        </View>
                    </View>
                )}
            </ScrollView>
        </>
    );
}

function createStyles(theme: Theme) {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        loadingContainer: {
            justifyContent: 'center',
            alignItems: 'center',
        },
        heroSection: {
            alignItems: 'center',
            padding: theme.spacing.xl,
            paddingTop: theme.spacing.xxl,
        },
        giftIcon: {
            width: 96,
            height: 96,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.warning + '20',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: theme.spacing.lg,
        },
        heroTitle: {
            fontSize: 28,
            fontWeight: 'bold',
            color: theme.colors.text,
            marginBottom: theme.spacing.sm,
        },
        heroSubtitle: {
            fontSize: theme.typography.size.md,
            color: theme.colors.textMuted,
            textAlign: 'center',
            maxWidth: 300,
        },
        section: {
            padding: theme.spacing.lg,
        },
        sectionTitle: {
            fontSize: theme.typography.size.lg,
            fontWeight: 'bold',
            color: theme.colors.text,
            marginBottom: theme.spacing.md,
        },
        codeCard: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.xl,
            padding: theme.spacing.lg,
            gap: theme.spacing.md,
            ...theme.shadows.sm,
        },
        codeText: {
            flex: 1,
            fontSize: 28,
            fontWeight: 'bold',
            color: theme.colors.primary,
            letterSpacing: 4,
        },
        copyButton: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.xs,
            backgroundColor: theme.colors.primary,
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
            borderRadius: theme.radius.full,
        },
        copyButtonText: {
            color: '#FFFFFF',
            fontSize: theme.typography.size.md,
            fontWeight: 'bold',
        },
        rewardsGrid: {
            flexDirection: 'row',
            gap: theme.spacing.md,
        },
        rewardCard: {
            flex: 1,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.lg,
            padding: theme.spacing.lg,
            alignItems: 'center',
            ...theme.shadows.sm,
        },
        rewardIcon: {
            width: 56,
            height: 56,
            borderRadius: theme.radius.full,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: theme.spacing.sm,
        },
        rewardTitle: {
            fontSize: theme.typography.size.sm,
            color: theme.colors.textMuted,
        },
        rewardValue: {
            fontSize: theme.typography.size.lg,
            fontWeight: 'bold',
            color: theme.colors.text,
            marginTop: 4,
        },
        statsCard: {
            flexDirection: 'row',
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.lg,
            padding: theme.spacing.lg,
            ...theme.shadows.sm,
        },
        statItem: {
            flex: 1,
            alignItems: 'center',
        },
        statValue: {
            fontSize: 24,
            fontWeight: 'bold',
            color: theme.colors.text,
        },
        statLabel: {
            fontSize: theme.typography.size.xs,
            color: theme.colors.textMuted,
            marginTop: 4,
        },
        statDivider: {
            width: 1,
            backgroundColor: theme.colors.border,
            marginHorizontal: theme.spacing.md,
        },
        inputContainer: {
            flexDirection: 'row',
            gap: theme.spacing.sm,
        },
        input: {
            flex: 1,
            height: 52,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.lg,
            paddingHorizontal: theme.spacing.lg,
            fontSize: theme.typography.size.lg,
            color: theme.colors.text,
            letterSpacing: 2,
            textTransform: 'uppercase',
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        applyButton: {
            height: 52,
            paddingHorizontal: theme.spacing.xl,
            backgroundColor: theme.colors.primary,
            borderRadius: theme.radius.lg,
            alignItems: 'center',
            justifyContent: 'center',
        },
        applyButtonDisabled: {
            opacity: 0.5,
        },
        applyButtonText: {
            color: '#FFFFFF',
            fontSize: theme.typography.size.md,
            fontWeight: 'bold',
        },
        errorText: {
            color: theme.colors.error,
            fontSize: theme.typography.size.sm,
            marginTop: theme.spacing.sm,
        },
        referralsList: {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.lg,
            overflow: 'hidden',
        },
        referralItem: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: theme.spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
        },
        referralInfo: {
            flex: 1,
        },
        referralUser: {
            fontSize: theme.typography.size.md,
            fontWeight: '600',
            color: theme.colors.text,
        },
        referralDate: {
            fontSize: theme.typography.size.xs,
            color: theme.colors.textMuted,
            marginTop: 2,
        },
        statusBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: 4,
            borderRadius: theme.radius.sm,
        },
        statusText: {
            fontSize: theme.typography.size.xs,
            fontWeight: '600',
        },
    });
}
