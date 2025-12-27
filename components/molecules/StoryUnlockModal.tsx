/**
 * StoryUnlockModal
 * Shown when user tries to access a premium/locked story
 */

import React, { memo } from 'react'
import { View, Text, Modal, Pressable, Image } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { useStoryUnlockAd } from '@/hooks/useRewardedAd'
import { REWARD_CONFIG } from '@/services/ads'
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
}

function StoryUnlockModalComponent({
    visible,
    storyId,
    storyTitle,
    storyCover,
    onClose,
    onUnlocked,
    onGetPremium,
}: StoryUnlockModalProps) {
    const { theme } = useUnistyles()
    const { t } = useTranslation()

    const { showAd, isLoading, isReady, isUnlocked } = useStoryUnlockAd(storyId)

    const handleWatchAd = async () => {
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
                        {t('ads.storyUnlock.description',
                            'Watch a short ad to unlock this story for 24 hours, or get Premium for unlimited access.'
                        )}
                    </Text>

                    {/* Unlock Duration Info */}
                    <View style={styles.infoRow}>
                        <Ionicons name="time-outline" size={18} color={theme.colors.textMuted} />
                        <Text style={styles.infoText}>
                            {t('ads.storyUnlock.duration',
                                `Access for ${REWARD_CONFIG.STORY_UNLOCK_DURATION_HOURS} hours`
                            )}
                        </Text>
                    </View>

                    {/* Actions */}
                    <View style={styles.actionsContainer}>
                        {/* Watch Ad Button */}
                        <Pressable
                            style={[
                                styles.watchAdButton,
                                (!isReady || isLoading) && styles.buttonDisabled,
                            ]}
                            onPress={handleWatchAd}
                            disabled={!isReady || isLoading}
                        >
                            {isLoading ? (
                                <Text style={styles.watchAdButtonText}>
                                    {t('ads.loading', 'Loading...')}
                                </Text>
                            ) : (
                                <>
                                    <Ionicons name="play-circle" size={24} color="#fff" />
                                    <Text style={styles.watchAdButtonText}>
                                        {t('ads.storyUnlock.watchAd', 'Watch Ad to Unlock')}
                                    </Text>
                                </>
                            )}
                        </Pressable>

                        {/* Premium Button */}
                        {onGetPremium && (
                            <Pressable
                                style={styles.premiumButton}
                                onPress={() => {
                                    haptics.selection()
                                    onGetPremium()
                                }}
                            >
                                <Ionicons name="star" size={20} color={theme.colors.warning} />
                                <Text style={styles.premiumButtonText}>
                                    {t('ads.storyUnlock.getPremium', 'Get Premium')}
                                </Text>
                            </Pressable>
                        )}
                    </View>

                    {/* Close Button */}
                    <Pressable style={styles.closeButton} onPress={onClose}>
                        <Ionicons name="close" size={24} color={theme.colors.textMuted} />
                    </Pressable>
                </Animated.View>
            </BlurView>
        </Modal>
    )
}

export const StoryUnlockModal = memo(StoryUnlockModalComponent)

const styles = StyleSheet.create((theme) => ({
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
