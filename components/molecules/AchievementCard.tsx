import React, { useEffect, useRef } from 'react'
import { View, Text, Animated } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'
import { Ionicons } from '@expo/vector-icons'
import { Achievement, AchievementRarity, RARITY_COLORS } from '@/store/achievementsStore'
import { Typography } from '@/components/atoms'

interface AchievementCardProps {
    achievement: Achievement & { unlocked: boolean }
    progress?: number // 0-1 for locked achievements
}

const RARITY_LABELS: Record<AchievementRarity, string> = {
    common: 'Common',
    rare: 'Rare',
    epic: 'Epic',
    legendary: 'Legendary',
}

const formatDate = (date: Date | undefined): string => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    })
}

export const AchievementCard: React.FC<AchievementCardProps> = ({ achievement, progress = 0 }) => {
    const { theme } = useUnistyles()
    const shimmerAnim = useRef(new Animated.Value(0)).current
    const scaleAnim = useRef(new Animated.Value(1)).current
    const rarityColors = RARITY_COLORS[achievement.rarity]

    useEffect(() => {
        if (achievement.unlocked) {
            // Shimmer animation for unlocked achievements
            Animated.loop(
                Animated.sequence([
                    Animated.timing(shimmerAnim, {
                        toValue: 1,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(shimmerAnim, {
                        toValue: 0,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                ])
            ).start()

            // Subtle pulse for legendary
            if (achievement.rarity === 'legendary') {
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(scaleAnim, {
                            toValue: 1.02,
                            duration: 1500,
                            useNativeDriver: true,
                        }),
                        Animated.timing(scaleAnim, {
                            toValue: 1,
                            duration: 1500,
                            useNativeDriver: true,
                        }),
                    ])
                ).start()
            }
        }
    }, [achievement.unlocked, achievement.rarity])

    const shimmerOpacity = shimmerAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.3, 0.6, 0.3],
    })

    return (
        <Animated.View
            style={[
                styles.card,
                { transform: [{ scale: scaleAnim }] },
                achievement.unlocked && {
                    borderWidth: 2,
                    borderColor: rarityColors.primary,
                    shadowColor: rarityColors.primary,
                    shadowOpacity: 0.4,
                    shadowRadius: 8,
                    elevation: 6,
                },
                !achievement.unlocked && styles.cardLocked,
            ]}
        >
            {/* Rarity indicator */}
            <View style={[styles.rarityBadge, { backgroundColor: rarityColors.primary }]}>
                <Text style={styles.rarityText}>{RARITY_LABELS[achievement.rarity]}</Text>
            </View>

            {/* Icon container with glow */}
            <View style={[
                styles.iconContainer,
                achievement.unlocked && {
                    backgroundColor: `${rarityColors.primary}20`,
                },
                !achievement.unlocked && styles.iconContainerLocked,
            ]}>
                <Text style={styles.iconText}>{achievement.icon}</Text>

                {/* Shimmer overlay for unlocked */}
                {achievement.unlocked && (
                    <Animated.View
                        style={[
                            styles.shimmer,
                            { opacity: shimmerOpacity, backgroundColor: rarityColors.glow },
                        ]}
                    />
                )}

                {/* Lock overlay for locked */}
                {!achievement.unlocked && (
                    <View style={styles.lockOverlay}>
                        <Ionicons name="lock-closed" size={20} color={theme.colors.textMuted} />
                    </View>
                )}
            </View>

            {/* Title */}
            <Typography
                style={[
                    styles.title,
                    achievement.unlocked && { color: rarityColors.primary },
                    !achievement.unlocked && styles.titleLocked,
                ]}
            >
                {achievement.title}
            </Typography>

            {/* Description */}
            <Typography style={[styles.description, !achievement.unlocked && styles.descriptionLocked]}>
                {achievement.description}
            </Typography>

            {/* Progress bar for locked achievements */}
            {!achievement.unlocked && progress > 0 && (
                <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                        <View
                            style={[
                                styles.progressFill,
                                { width: `${progress * 100}%`, backgroundColor: rarityColors.primary },
                            ]}
                        />
                    </View>
                    <Typography style={styles.progressText}>{Math.round(progress * 100)}%</Typography>
                </View>
            )}

            {/* Unlock date */}
            {achievement.unlocked && achievement.unlockedAt && (
                <View style={styles.unlockedContainer}>
                    <Ionicons name="checkmark-circle" size={14} color={rarityColors.primary} />
                    <Typography style={[styles.unlockedDate, { color: rarityColors.primary }]}>
                        {formatDate(achievement.unlockedAt)}
                    </Typography>
                </View>
            )}
        </Animated.View>
    )
}

const styles = StyleSheet.create((theme) => ({
    card: {
        width: '48%',
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        ...theme.shadows.sm,
    },
    cardLocked: {
        opacity: 0.7,
    },
    rarityBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    rarityText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#FFFFFF',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.colors.backgroundSecondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        marginTop: 8,
        position: 'relative',
        overflow: 'hidden',
    },
    iconContainerLocked: {
        backgroundColor: theme.colors.backgroundSecondary,
    },
    iconText: {
        fontSize: 28,
    },
    shimmer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 28,
    },
    lockOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: 4,
    },
    titleLocked: {
        color: theme.colors.textMuted,
    },
    description: {
        fontSize: 11,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 14,
    },
    descriptionLocked: {
        color: theme.colors.textMuted,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        width: '100%',
        gap: 6,
    },
    progressBar: {
        flex: 1,
        height: 4,
        backgroundColor: theme.colors.backgroundSecondary,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
    progressText: {
        fontSize: 10,
        fontWeight: '600',
        color: theme.colors.textMuted,
    },
    unlockedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 4,
    },
    unlockedDate: {
        fontSize: 11,
        fontWeight: '600',
    },
}))
