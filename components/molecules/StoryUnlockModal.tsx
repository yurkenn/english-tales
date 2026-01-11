/**
 * StoryUnlockModal
 * Shown when user tries to access a premium/locked story
 */

import React, { memo } from 'react'
import { View, Text, Modal, TouchableOpacity, Image } from 'react-native'
import { useTheme, Theme } from '@/theme';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { useStoryUnlockAd } from '@/hooks/useRewardedAd'
import { REWARD_CONFIG } from '@/services/ads'
import { useCoinStore, COIN_COSTS } from '@/store/coinStore'
import { unlockStoryWithCoins } from '@/services/storyGating'
import { useTranslation } from 'react-i18next'
import { haptics } from '@/utils/haptics'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'

interface StoryUnlockModalProps {
    visible: boolean
    storyId: string
    storyTitle: string
    storyCover?: string
    onClose: () => void
    onUnlocked?: () => void
    onGetPremium?: () => void
    isPremiumOnly?: boolean
}

function StoryUnlockModalComponent({
    visible,
    storyId,
    storyTitle,
    storyCover,
    onClose,
    onUnlocked,
    onGetPremium,
    isPremiumOnly = false,
}: StoryUnlockModalProps) {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const { t } = useTranslation()

    const { showAd, isLoading, isReady, isUnlocked, loadAd } = useStoryUnlockAd(storyId)
    const coinBalance = useCoinStore((s) => s.balance)
    const canAffordUnlock = coinBalance >= COIN_COSTS.UNLOCK_STORY_24H

    const handleWatchAd = async () => {
        if (!isReady) {
            loadAd()
            return
        }

        const success = await showAd()
        if (success) {
            haptics.success()
            onUnlocked?.()
            onClose()
        }
    }

    // If already unlocked, auto-close
    React.useEffect(() => {
        if (visible && isUnlocked) {
            onUnlocked?.()
            onClose()
        }
    }, [visible, isUnlocked, onUnlocked, onClose])

    // Refresh ad status when modal becomes visible
    React.useEffect(() => {
        if (visible && !isReady) {
            loadAd()
        }
    }, [visible, isReady, loadAd])

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <BlurView intensity={30} style={styles.overlay}>
                <Animated.View
                    entering={FadeIn.duration(200)}
                    exiting={FadeOut.duration(150)}
                    style={styles.container}
                >
                    {/* Story Cover */}
                    {storyCover && (
                        <View style={styles.coverContainer}>
                            <Image
                                source={{ uri: storyCover }}
                                style={styles.coverImage}
                                resizeMode="cover"
                            />
                            <View style={styles.lockOverlay}>
                                <Ionicons
                                    name="lock-closed"
                                    size={32}
                                    color="#fff"
                                />
                            </View>
                        </View>
                    )}

                    {/* Title */}
                    <Text style={styles.storyTitle} numberOfLines={2}>
                        {storyTitle}
                    </Text>

                    {/* Lock Badge */}
                    <View style={styles.premiumBadge}>
                        <Ionicons name="star" size={14} color={theme.colors.warning} />
                        <Text style={styles.premiumBadgeText}>
                            {t('ads.storyUnlock.premiumContent', 'Premium Content')}
                        </Text>
                    </View>

                    {/* Description */}
                    <Text style={styles.description}>
                        {isPremiumOnly
                            ? t('ads.storyUnlock.premiumOnlyDescription', 'This story is exclusive for Premium members. Unlock unlimited access to all stories!')
                            : t('ads.storyUnlock.description', 'Watch a short ad to unlock this story for 24 hours, or get Premium for unlimited access.')
                        }
                    </Text>

                    {/* Unlock Duration Info */}
                    {!isPremiumOnly && (
                        <View style={styles.infoRow}>
                            <Ionicons name="time-outline" size={18} color={theme.colors.textMuted} />
                            <Text style={styles.infoText}>
                                {t('ads.storyUnlock.duration',
                                    `Access for ${REWARD_CONFIG.STORY_UNLOCK_DURATION_HOURS} hours`
                                )}
                            </Text>
                        </View>
                    )}

                    {/* Actions */}
                    <View style={styles.actionsContainer}>
                        {/* Watch Ad Button */}
                        {!isPremiumOnly && (
                            <TouchableOpacity
                                style={[
                                    styles.watchAdButton,
                                    isLoading && styles.buttonDisabled,
                                ]}
                                onPress={handleWatchAd}
                                disabled={isLoading}
                                activeOpacity={0.8}
                            >
                                {isLoading ? (
                                    <Text style={styles.watchAdButtonText}>
                                        {t('ads.loading', 'Loading...')}
                                    </Text>
                                ) : !isReady ? (
                                    <Text style={styles.watchAdButtonText}>
                                        {t('ads.storyUnlock.loadAd', 'Tap to Load Ad')}
                                    </Text>
                                ) : (
                                    <>
                                        <Ionicons name="play-circle" size={24} color="#fff" />
                                        <Text style={styles.watchAdButtonText}>
                                            {t('ads.storyUnlock.watchAd', 'Watch Ad to Unlock')}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}



                        {/* Premium Button */}
                        {onGetPremium && (
                            <TouchableOpacity
                                style={[
                                    styles.premiumButton,
                                    isPremiumOnly && styles.premiumButtonPrimary,
                                ]}
                                onPress={() => {
                                    haptics.selection()
                                    onGetPremium()
                                }}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name="star"
                                    size={20}
                                    color={isPremiumOnly ? '#fff' : theme.colors.warning}
                                />
                                <Text style={[
                                    styles.premiumButtonText,
                                    isPremiumOnly && styles.premiumButtonTextPrimary,
                                ]}>
                                    {t('ads.storyUnlock.getPremium', 'Get Premium')}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Close Button */}
                    <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
                        <Ionicons name="close" size={24} color={theme.colors.textMuted} />
                    </TouchableOpacity>
                </Animated.View>
            </BlurView>
        </Modal>
    )
}

export const StoryUnlockModal = memo(StoryUnlockModalComponent)

const createStyles = (theme: Theme) => StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
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
    coverContainer: {
        width: 120,
        height: 160,
        borderRadius: theme.radius.lg,
        overflow: 'hidden',
        marginBottom: theme.spacing.lg,
        ...theme.shadows.md,
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    lockOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    storyTitle: {
        fontSize: theme.typography.size.xl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: theme.spacing.sm,
    },
    premiumBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
        backgroundColor: theme.colors.warning + '20',
        paddingVertical: theme.spacing.xs,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.radius.full,
        marginBottom: theme.spacing.lg,
    },
    premiumBadgeText: {
        fontSize: theme.typography.size.sm,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.warning,
    },
    description: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: theme.spacing.md,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
        marginBottom: theme.spacing.xl,
    },
    infoText: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textMuted,
    },
    actionsContainer: {
        width: '100%',
        gap: theme.spacing.md,
    },
    watchAdButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.lg,
        borderRadius: theme.radius.lg,
        ...theme.shadows.md,
    },
    watchAdButtonText: {
        fontSize: theme.typography.size.lg,
        fontWeight: theme.typography.weight.bold,
        color: '#fff',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    coinButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.radius.lg,
    },
    coinButtonText: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.text,
    },
    coinBalanceText: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textMuted,
    },
    premiumButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        borderWidth: 2,
        borderColor: theme.colors.warning,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.radius.lg,
    },
    premiumButtonText: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.warning,
    },
    premiumButtonPrimary: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    premiumButtonTextPrimary: {
        color: '#fff',
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
});
