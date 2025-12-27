/**
 * DailyBonusModal
 * Shows daily login rewards with 7-day cycle and 2x ad bonus
 */

import React, { memo, useCallback } from 'react'
import { View, Text, Modal, Pressable, ScrollView, ActivityIndicator } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { useTranslation } from 'react-i18next'
import { haptics } from '@/utils/haptics'
import { useCoinStore, COIN_REWARDS } from '@/store/coinStore'
import { useRewardStore } from '@/store/rewardStore'
import { useRewardedAd } from '@/hooks/useRewardedAd'

// Daily rewards configuration (7-day cycle)
const DAILY_REWARDS = [
    { day: 1, coins: 10, translations: 1, icon: '🪙' },
    { day: 2, coins: 20, translations: 2, icon: '🪙' },
    { day: 3, coins: 30, translations: 3, icon: '🪙' },
    { day: 4, coins: 50, translations: 5, icon: '💰' },
    { day: 5, coins: 75, streakProtector: true, icon: '🛡️' },
    { day: 6, coins: 100, translations: 10, icon: '💰' },
    { day: 7, coins: 200, premiumTrial: 1, icon: '👑' }, // 1 hour trial
] as const

interface DailyBonusModalProps {
    visible: boolean
    currentDay: number // 1-7
    onClose: () => void
    onClaimed: () => void
}

function DailyBonusModalComponent({
    visible,
    currentDay,
    onClose,
    onClaimed,
}: DailyBonusModalProps) {
    const { theme } = useUnistyles()
    const { t } = useTranslation()
    const coinActions = useCoinStore((s) => s.actions)
    const rewardActions = useRewardStore((s) => s.actions)
    const [showDoubleAd, setShowDoubleAd] = React.useState(false)
    const [claimed, setClaimed] = React.useState(false)

    const todayReward = DAILY_REWARDS[(currentDay - 1) % 7]

    const { showAd, isLoading: adLoading } = useRewardedAd({
        rewardType: 'translation', // Use translation ad unit
        onRewardEarned: () => {
            // Double the reward
            applyReward(2)
            haptics.success()
            setClaimed(true)
            setTimeout(() => {
                onClaimed()
                onClose()
            }, 1500)
        },
    })

    const applyReward = useCallback((multiplier: number = 1) => {
        const reward = todayReward

        // Apply coins
        if (reward.coins) {
            coinActions.earnCoins(reward.coins * multiplier, `DAILY_DAY_${currentDay}`)
        }

        // Apply translations
        if ('translations' in reward && reward.translations) {
            rewardActions.addTranslations(reward.translations * multiplier)
        }

        // Apply streak protector
        if ('streakProtector' in reward && reward.streakProtector) {
            rewardActions.grantStreakProtector()
        }

        // Apply premium trial
        if ('premiumTrial' in reward && reward.premiumTrial) {
            rewardActions.grantPremiumTrial(reward.premiumTrial * multiplier)
        }
    }, [todayReward, currentDay, coinActions, rewardActions])

    const handleClaim = useCallback(() => {
        haptics.selection()
        setShowDoubleAd(true)
    }, [])

    const handleClaimNormal = useCallback(() => {
        haptics.success()
        applyReward(1)
        setClaimed(true)
        setTimeout(() => {
            onClaimed()
            onClose()
        }, 1500)
    }, [applyReward, onClaimed, onClose])

    const handleWatchAd = useCallback(async () => {
        haptics.selection()
        await showAd()
    }, [showAd])

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <BlurView intensity={25} style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>
                            {t('dailyBonus.title', 'Daily Bonus')}
                        </Text>
                        <Text style={styles.subtitle}>
                            {t('dailyBonus.day', 'Day {{day}}', { day: currentDay })}
                        </Text>
                    </View>

                    {/* Reward Days */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.daysContainer}
                    >
                        {DAILY_REWARDS.map((reward, index) => {
                            const isToday = index + 1 === currentDay
                            const isPast = index + 1 < currentDay

                            return (
                                <View
                                    key={reward.day}
                                    style={[
                                        styles.dayCard,
                                        isToday && styles.dayCardActive,
                                        isPast && styles.dayCardPast,
                                    ]}
                                >
                                    <Text style={styles.dayNumber}>
                                        {t('dailyBonus.dayLabel', 'Day {{n}}', { n: reward.day })}
                                    </Text>
                                    <Text style={styles.dayIcon}>{reward.icon}</Text>
                                    <Text style={[
                                        styles.dayCoins,
                                        isToday && styles.dayCoinsActive,
                                    ]}>
                                        {reward.coins}
                                    </Text>
                                    {isPast && (
                                        <View style={styles.checkmark}>
                                            <Ionicons name="checkmark" size={14} color="#fff" />
                                        </View>
                                    )}
                                </View>
                            )
                        })}
                    </ScrollView>

                    {/* Today's Reward Details */}
                    <View style={styles.todayReward}>
                        <Text style={styles.todayTitle}>
                            {t('dailyBonus.todayReward', "Today's Reward")}
                        </Text>
                        <View style={styles.rewardRow}>
                            <Ionicons name="logo-bitcoin" size={24} color="#FFD700" />
                            <Text style={styles.rewardText}>
                                {todayReward.coins} Coins
                            </Text>
                        </View>
                        {'translations' in todayReward && todayReward.translations && (
                            <View style={styles.rewardRow}>
                                <Ionicons name="language" size={24} color={theme.colors.primary} />
                                <Text style={styles.rewardText}>
                                    +{todayReward.translations} {t('dailyBonus.translations', 'Translations')}
                                </Text>
                            </View>
                        )}
                        {'streakProtector' in todayReward && todayReward.streakProtector && (
                            <View style={styles.rewardRow}>
                                <Ionicons name="shield-checkmark" size={24} color={theme.colors.success} />
                                <Text style={styles.rewardText}>
                                    {t('dailyBonus.streakProtector', 'Streak Protector')}
                                </Text>
                            </View>
                        )}
                        {'premiumTrial' in todayReward && todayReward.premiumTrial && (
                            <View style={styles.rewardRow}>
                                <Ionicons name="star" size={24} color={theme.colors.warning} />
                                <Text style={styles.rewardText}>
                                    {todayReward.premiumTrial}h {t('dailyBonus.premiumTrial', 'Premium Trial')}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Actions */}
                    {!showDoubleAd && !claimed && (
                        <Pressable style={styles.claimButton} onPress={handleClaim}>
                            <Text style={styles.claimButtonText}>
                                {t('dailyBonus.claim', 'Claim Reward')}
                            </Text>
                        </Pressable>
                    )}

                    {showDoubleAd && !claimed && (
                        <View style={styles.doubleContainer}>
                            <Text style={styles.doubleTitle}>
                                {t('dailyBonus.doubleOffer', 'Double your reward?')}
                            </Text>
                            <Pressable
                                style={styles.doubleAdButton}
                                onPress={handleWatchAd}
                                disabled={adLoading}
                            >
                                {adLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Ionicons name="play-circle" size={22} color="#fff" />
                                        <Text style={styles.doubleAdButtonText}>
                                            {t('dailyBonus.watchAd', 'Watch Ad for 2x')}
                                        </Text>
                                    </>
                                )}
                            </Pressable>
                            <Pressable style={styles.skipDoubleButton} onPress={handleClaimNormal}>
                                <Text style={styles.skipDoubleText}>
                                    {t('dailyBonus.claimNormal', 'Claim 1x Instead')}
                                </Text>
                            </Pressable>
                        </View>
                    )}

                    {claimed && (
                        <View style={styles.claimedContainer}>
                            <Ionicons name="checkmark-circle" size={48} color={theme.colors.success} />
                            <Text style={styles.claimedText}>
                                {t('dailyBonus.claimed', 'Claimed!')}
                            </Text>
                        </View>
                    )}

                    {/* Close */}
                    {!claimed && (
                        <Pressable style={styles.closeButton} onPress={onClose}>
                            <Ionicons name="close" size={24} color={theme.colors.textMuted} />
                        </Pressable>
                    )}
                </View>
            </BlurView>
        </Modal>
    )
}

export const DailyBonusModal = memo(DailyBonusModalComponent)

const styles = StyleSheet.create((theme) => ({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    container: {
        width: '92%',
        maxWidth: 400,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xxl,
        padding: theme.spacing.xl,
        alignItems: 'center',
        ...theme.shadows.lg,
    },
    header: {
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    title: {
        fontSize: theme.typography.size.xxl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    subtitle: {
        fontSize: theme.typography.size.md,
        color: theme.colors.primary,
        fontWeight: theme.typography.weight.semibold,
        marginTop: theme.spacing.xs,
    },
    daysContainer: {
        paddingHorizontal: theme.spacing.sm,
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.xl,
    },
    dayCard: {
        width: 60,
        alignItems: 'center',
        padding: theme.spacing.sm,
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    dayCardActive: {
        backgroundColor: theme.colors.primary + '15',
        borderColor: theme.colors.primary,
        borderWidth: 2,
    },
    dayCardPast: {
        opacity: 0.6,
    },
    dayNumber: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.textMuted,
        marginBottom: 4,
    },
    dayIcon: {
        fontSize: 20,
        marginBottom: 4,
    },
    dayCoins: {
        fontSize: theme.typography.size.sm,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    dayCoinsActive: {
        color: theme.colors.primary,
    },
    checkmark: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: theme.colors.success,
        justifyContent: 'center',
        alignItems: 'center',
    },
    todayReward: {
        width: '100%',
        backgroundColor: theme.colors.background,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.xl,
    },
    todayTitle: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textMuted,
        marginBottom: theme.spacing.md,
    },
    rewardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.sm,
    },
    rewardText: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.text,
    },
    claimButton: {
        width: '100%',
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.lg,
        borderRadius: theme.radius.lg,
        alignItems: 'center',
    },
    claimButtonText: {
        fontSize: theme.typography.size.lg,
        fontWeight: theme.typography.weight.bold,
        color: '#fff',
    },
    doubleContainer: {
        width: '100%',
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    doubleTitle: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
    },
    doubleAdButton: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        backgroundColor: theme.colors.success,
        paddingVertical: theme.spacing.lg,
        borderRadius: theme.radius.lg,
    },
    doubleAdButtonText: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.bold,
        color: '#fff',
    },
    skipDoubleButton: {
        paddingVertical: theme.spacing.sm,
    },
    skipDoubleText: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textMuted,
    },
    claimedContainer: {
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    claimedText: {
        fontSize: theme.typography.size.xl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.success,
    },
    closeButton: {
        position: 'absolute',
        top: theme.spacing.md,
        right: theme.spacing.md,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
}))
