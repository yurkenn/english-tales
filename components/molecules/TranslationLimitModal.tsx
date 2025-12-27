/**
 * TranslationLimitModal
 * Shown when user reaches daily translation limit
 */

import React, { memo } from 'react'
import { View, Text, Modal, Pressable } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { RewardedAdButton } from './RewardedAdButton'
import { useRewardStore } from '@/store/rewardStore'
import { REWARD_CONFIG } from '@/services/ads'
import { useTranslation } from 'react-i18next'
import { haptics } from '@/utils/haptics'

interface TranslationLimitModalProps {
    visible: boolean
    onClose: () => void
    onRewardEarned?: () => void
    onGetPremium?: () => void
}

function TranslationLimitModalComponent({
    visible,
    onClose,
    onRewardEarned,
    onGetPremium,
}: TranslationLimitModalProps) {
    const { theme } = useUnistyles()
    const { t } = useTranslation()
    const remainingTranslations = useRewardStore((state) =>
        state.actions.getRemainingTranslations()
    )

    const handleRewardEarned = () => {
        haptics.success()
        onRewardEarned?.()
        onClose()
    }

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <BlurView intensity={20} style={styles.overlay}>
                <View style={styles.container}>
                    {/* Icon */}
                    <View style={styles.iconContainer}>
                        <Ionicons
                            name="language"
                            size={48}
                            color={theme.colors.warning}
                        />
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>
                        {t('ads.translationLimit.title', 'Translation Limit Reached')}
                    </Text>

                    {/* Description */}
                    <Text style={styles.description}>
                        {t('ads.translationLimit.description',
                            `You've used all ${REWARD_CONFIG.DAILY_FREE_TRANSLATIONS} free translations for today.`
                        )}
                    </Text>

                    {/* Remaining count */}
                    <View style={styles.countContainer}>
                        <Text style={styles.countLabel}>
                            {t('ads.translationLimit.remaining', 'Remaining translations')}
                        </Text>
                        <Text style={styles.countValue}>{remainingTranslations}</Text>
                    </View>

                    {/* Options */}
                    <View style={styles.optionsContainer}>
                        {/* Watch Ad Option */}
                        <RewardedAdButton
                            rewardType="translation"
                            buttonText={t('ads.translationLimit.watchAd', 'Watch ad')}
                            rewardDescription={`+${REWARD_CONFIG.TRANSLATIONS_PER_AD} ${t('ads.translationLimit.translations', 'translations')}`}
                            onRewardEarned={handleRewardEarned}
                            variant="primary"
                            size="lg"
                        />

                        {/* Premium Option */}
                        {onGetPremium && (
                            <Pressable
                                style={styles.premiumButton}
                                onPress={() => {
                                    haptics.selection()
                                    onGetPremium()
                                }}
                            >
                                <Ionicons
                                    name="star"
                                    size={20}
                                    color={theme.colors.warning}
                                />
                                <Text style={styles.premiumButtonText}>
                                    {t('ads.translationLimit.getPremium', 'Get Premium for unlimited')}
                                </Text>
                            </Pressable>
                        )}
                    </View>

                    {/* Close button */}
                    <Pressable style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>
                            {t('common.close', 'Close')}
                        </Text>
                    </Pressable>
                </View>
            </BlurView>
        </Modal>
    )
}

export const TranslationLimitModal = memo(TranslationLimitModalComponent)

const styles = StyleSheet.create((theme) => ({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    container: {
        width: '85%',
        maxWidth: 360,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xxl,
        padding: theme.spacing.xl,
        alignItems: 'center',
        ...theme.shadows.lg,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
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
        marginBottom: theme.spacing.sm,
    },
    description: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: theme.spacing.lg,
    },
    countContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.background,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.radius.lg,
        width: '100%',
        marginBottom: theme.spacing.xl,
    },
    countLabel: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textMuted,
    },
    countValue: {
        fontSize: theme.typography.size.xl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    optionsContainer: {
        width: '100%',
        gap: theme.spacing.md,
    },
    premiumButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.radius.lg,
        borderWidth: 2,
        borderColor: theme.colors.warning,
        backgroundColor: theme.colors.warning + '10',
    },
    premiumButtonText: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.warning,
    },
    closeButton: {
        marginTop: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
    },
    closeButtonText: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textMuted,
    },
}))
