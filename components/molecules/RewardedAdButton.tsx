/**
 * RewardedAdButton
 * A button to watch rewarded ads and earn rewards
 */

import React, { memo } from 'react'
import { Pressable, Text, View, ActivityIndicator } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'
import { Ionicons } from '@expo/vector-icons'
import { useRewardedAd } from '@/hooks/useRewardedAd'
import { RewardType } from '@/services/ads'
import { useTranslation } from 'react-i18next'

interface RewardedAdButtonProps {
    rewardType: RewardType
    buttonText?: string
    rewardDescription?: string
    onRewardEarned?: () => void
    onError?: (error: string) => void
    variant?: 'primary' | 'secondary' | 'outline'
    size?: 'sm' | 'md' | 'lg'
    disabled?: boolean
}

function RewardedAdButtonComponent({
    rewardType,
    buttonText,
    rewardDescription,
    onRewardEarned,
    onError,
    variant = 'primary',
    size = 'md',
    disabled = false,
}: RewardedAdButtonProps) {
    const { theme } = useUnistyles()
    const { t } = useTranslation()

    const { showAd, isLoading, isReady, canWatch } = useRewardedAd({
        rewardType,
        onRewardEarned,
        onError,
    })

    const isDisabled = disabled || !canWatch || isLoading

    const getDefaultText = () => {
        switch (rewardType) {
            case 'translation':
                return t('ads.watchForTranslations', 'Watch ad for +10 translations')
            case 'story_unlock':
                return t('ads.watchToUnlock', 'Watch ad to unlock')
            case 'streak_protector':
                return t('ads.watchForStreak', 'Watch ad to protect streak')
            default:
                return t('ads.watchAd', 'Watch ad')
        }
    }

    const handlePress = async () => {
        if (isDisabled) return
        await showAd()
    }

    const getButtonStyle = () => {
        return [
            styles.button,
            size === 'sm' && styles.buttonSm,
            size === 'md' && styles.buttonMd,
            size === 'lg' && styles.buttonLg,
            variant === 'primary' && styles.buttonPrimary,
            variant === 'secondary' && styles.buttonSecondary,
            variant === 'outline' && styles.buttonOutline,
            isDisabled && styles.buttonDisabled,
        ].filter(Boolean)
    }

    const getTextColor = () => {
        if (isDisabled) return theme.colors.textMuted
        switch (variant) {
            case 'outline':
                return theme.colors.primary
            default:
                return theme.colors.textInverse
        }
    }

    return (
        <Pressable
            style={getButtonStyle()}
            onPress={handlePress}
            disabled={isDisabled}
        >
            {isLoading ? (
                <ActivityIndicator size="small" color={getTextColor()} />
            ) : (
                <>
                    <Ionicons
                        name="play-circle"
                        size={size === 'sm' ? 18 : size === 'lg' ? 26 : 22}
                        color={getTextColor()}
                    />
                    <View style={styles.textContainer}>
                        <Text style={[styles.buttonText, { color: getTextColor() }]}>
                            {buttonText || getDefaultText()}
                        </Text>
                        {rewardDescription && (
                            <Text style={[styles.rewardDescription, { color: getTextColor() }]}>
                                {rewardDescription}
                            </Text>
                        )}
                    </View>
                </>
            )}

            {!isReady && !isLoading && (
                <View style={styles.loadingBadge}>
                    <Text style={styles.loadingBadgeText}>
                        {t('ads.loading', 'Loading...')}
                    </Text>
                </View>
            )}
        </Pressable>
    )
}

export const RewardedAdButton = memo(RewardedAdButtonComponent)

const styles = StyleSheet.create((theme) => ({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        borderRadius: theme.radius.lg,
    },
    buttonSm: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
    },
    buttonMd: {
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
    },
    buttonLg: {
        paddingVertical: theme.spacing.lg,
        paddingHorizontal: theme.spacing.xl,
    },
    buttonPrimary: {
        backgroundColor: theme.colors.primary,
    },
    buttonSecondary: {
        backgroundColor: theme.colors.surface,
    },
    buttonOutline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: theme.colors.primary,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    textContainer: {
        alignItems: 'flex-start',
    },
    buttonText: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.semibold,
    },
    rewardDescription: {
        fontSize: theme.typography.size.xs,
        opacity: 0.8,
    },
    loadingBadge: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: theme.colors.warning,
        paddingHorizontal: theme.spacing.xs,
        paddingVertical: 2,
        borderRadius: theme.radius.sm,
    },
    loadingBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#000',
    },
}))
