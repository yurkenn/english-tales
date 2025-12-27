/**
 * StreakProtectionModal
 * Modal to save user's reading streak via coins, ad, or premium
 */

import React, { memo, useCallback } from 'react'
import { View, Text, Modal, Pressable, ActivityIndicator } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { useTranslation } from 'react-i18next'
import { haptics } from '@/utils/haptics'
import { useCoinStore, COIN_COSTS } from '@/store/coinStore'
import { useRewardStore } from '@/store/rewardStore'
import { useRewardedAd } from '@/hooks/useRewardedAd'

interface StreakProtectionModalProps {
    visible: boolean
    currentStreak: number
    onClose: () => void
    onProtected: () => void
    onGetPremium: () => void
}

function StreakProtectionModalComponent({
    visible,
    currentStreak,
    onClose,
    onProtected,
    onGetPremium,
}: StreakProtectionModalProps) {
    const { theme } = useUnistyles()
    const { t } = useTranslation()
    const coinBalance = useCoinStore((s) => s.balance)
    const canAfford = coinBalance >= COIN_COSTS.STREAK_PROTECTOR
    const rewardActions = useRewardStore((s) => s.actions)

    const { showAd, isLoading: adLoading } = useRewardedAd({
        rewardType: 'streak_protector',
        onRewardEarned: () => {
            haptics.success()
            onProtected()
            onClose()
        },
    })

    const handleWatchAd = useCallback(async () => {
        haptics.selection()
        await showAd()
    }, [showAd])

    const handlePayWithCoins = useCallback(() => {
        haptics.selection()
        const coinActions = useCoinStore.getState().actions

        if (coinActions.buyStreakProtector()) {
            rewardActions.grantStreakProtector()
            haptics.success()
            onProtected()
            onClose()
        }
    }, [rewardActions, onProtected, onClose])

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <BlurView intensity={25} style={styles.overlay}>
                <View style={styles.container}>
                    {/* Fire Icon */}
                    <View style={styles.iconContainer}>
                        <Ionicons name="flame" size={56} color={theme.colors.warning} />
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>
                        {t('streak.protection.title', 'Protect Your Streak!')}
                    </Text>

                    {/* Streak Count */}
                    <View style={styles.streakBadge}>
                        <Ionicons name="flame" size={18} color={theme.colors.warning} />
                        <Text style={styles.streakCount}>{currentStreak}</Text>
                        <Text style={styles.streakLabel}>
                            {t('streak.days', 'day streak')}
                        </Text>
                    </View>

                    {/* Description */}
                    <Text style={styles.description}>
                        {t('streak.protection.description',
                            "You're about to lose your reading streak! Protect it now to keep your progress."
                        )}
                    </Text>

                    {/* Options */}
                    <View style={styles.optionsContainer}>
                        {/* Watch Ad */}
                        <Pressable
                            style={styles.adButton}
                            onPress={handleWatchAd}
                            disabled={adLoading}
                        >
                            {adLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="play-circle" size={24} color="#fff" />
                                    <View style={styles.optionTextContainer}>
                                        <Text style={styles.adButtonText}>
                                            {t('streak.protection.watchAd', 'Watch Ad')}
                                        </Text>
                                        <Text style={styles.adButtonSubtext}>
                                            {t('streak.protection.freeProtection', 'Free protection')}
                                        </Text>
                                    </View>
                                </>
                            )}
                        </Pressable>

                        {/* Pay with Coins */}
                        <Pressable
                            style={[styles.coinButton, !canAfford && styles.buttonDisabled]}
                            onPress={handlePayWithCoins}
                            disabled={!canAfford}
                        >
                            <Ionicons
                                name="logo-bitcoin"
                                size={22}
                                color={canAfford ? '#FFD700' : theme.colors.textMuted}
                            />
                            <View style={styles.optionTextContainer}>
                                <Text style={[styles.coinButtonText, !canAfford && styles.textDisabled]}>
                                    {COIN_COSTS.STREAK_PROTECTOR} Coins
                                </Text>
                                <Text style={[styles.coinButtonSubtext, !canAfford && styles.textDisabled]}>
                                    {canAfford
                                        ? t('streak.protection.youHave', 'You have {{count}}', { count: coinBalance })
                                        : t('streak.protection.notEnough', 'Not enough coins')
                                    }
                                </Text>
                            </View>
                        </Pressable>

                        {/* Go Premium */}
                        <Pressable style={styles.premiumButton} onPress={() => {
                            haptics.selection()
                            onGetPremium()
                        }}>
                            <Ionicons name="shield-checkmark" size={20} color={theme.colors.primary} />
                            <Text style={styles.premiumButtonText}>
                                {t('streak.protection.goPremium', 'Go Premium - Auto Protection')}
                            </Text>
                        </Pressable>
                    </View>

                    {/* Skip */}
                    <Pressable style={styles.skipButton} onPress={onClose}>
                        <Text style={styles.skipText}>
                            {t('streak.protection.skip', 'Skip & Lose Streak')}
                        </Text>
                    </Pressable>
                </View>
            </BlurView>
        </Modal>
    )
}

export const StreakProtectionModal = memo(StreakProtectionModalComponent)

const styles = StyleSheet.create((theme) => ({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    container: {
        width: '88%',
        maxWidth: 380,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xxl,
        padding: theme.spacing.xl,
        alignItems: 'center',
        ...theme.shadows.lg,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: theme.colors.warning + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    title: {
        fontSize: theme.typography.size.xl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: theme.spacing.md,
    },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
        backgroundColor: theme.colors.warning + '15',
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.radius.full,
        marginBottom: theme.spacing.lg,
    },
    streakCount: {
        fontSize: theme.typography.size.xxl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.warning,
    },
    streakLabel: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.warning,
    },
    description: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: theme.spacing.xl,
    },
    optionsContainer: {
        width: '100%',
        gap: theme.spacing.md,
    },
    adButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.lg,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.radius.lg,
    },
    optionTextContainer: {
        flex: 1,
    },
    adButtonText: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.semibold,
        color: '#fff',
    },
    adButtonSubtext: {
        fontSize: theme.typography.size.xs,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
    },
    coinButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingVertical: theme.spacing.lg,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.radius.lg,
    },
    coinButtonText: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.text,
    },
    coinButtonSubtext: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.textMuted,
        marginTop: 2,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    textDisabled: {
        color: theme.colors.textMuted,
    },
    premiumButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        borderWidth: 2,
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primary + '10',
        paddingVertical: theme.spacing.md,
        borderRadius: theme.radius.lg,
    },
    premiumButtonText: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.primary,
    },
    skipButton: {
        marginTop: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
    },
    skipText: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textMuted,
    },
}))
