import React, { useMemo } from 'react'
import { View, Pressable } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Typography } from '@/components/atoms'
import { useVocabularyStore } from '@/store/vocabularyStore'
import { useAuthStore } from '@/store/authStore'
import { haptics } from '@/utils/haptics'

// Milestones that trigger the card
const MILESTONES = [5, 10, 20, 50, 100]

const getMilestoneMessage = (count: number): { emoji: string; title: string; subtitle: string } => {
    if (count >= 100) {
        return { emoji: '👑', title: 'Vocabulary Master!', subtitle: `${count} words mastered` }
    } else if (count >= 50) {
        return { emoji: '🌟', title: 'Amazing progress!', subtitle: `${count} words saved` }
    } else if (count >= 20) {
        return { emoji: '🔥', title: 'You\'re on fire!', subtitle: `${count} words ready to practice` }
    } else if (count >= 10) {
        return { emoji: '📚', title: 'Great collection!', subtitle: `Practice your ${count} words` }
    } else if (count >= 5) {
        return { emoji: '✨', title: 'Ready to practice?', subtitle: `You have ${count} words saved` }
    }
    return { emoji: '', title: '', subtitle: '' }
}

interface VocabularyMilestoneCardProps {
    onDismiss?: () => void
}

export const VocabularyMilestoneCard: React.FC<VocabularyMilestoneCardProps> = ({ onDismiss }) => {
    const { theme } = useUnistyles()
    const router = useRouter()

    const { user } = useAuthStore()
    const { actions: vocabActions } = useVocabularyStore()

    const wordCount = useMemo(() => {
        if (!user) return 0
        return vocabActions.getWordsForUser(user.id).length
    }, [user, vocabActions])

    // Only show if user has reached a milestone
    const isAtMilestone = MILESTONES.some(m => wordCount >= m)

    if (!isAtMilestone || wordCount < 5) {
        return null
    }

    const message = getMilestoneMessage(wordCount)

    const handlePress = () => {
        haptics.medium()
        router.push('/user/quiz')
    }

    const handleDismiss = () => {
        haptics.light()
        onDismiss?.()
    }

    return (
        <Pressable onPress={handlePress} style={styles.container}>
            <View style={styles.card}>
                {/* Dismiss button */}
                {onDismiss && (
                    <Pressable
                        onPress={handleDismiss}
                        style={styles.dismissButton}
                        hitSlop={12}
                    >
                        <Ionicons name="close" size={16} color={theme.colors.textMuted} />
                    </Pressable>
                )}

                <View style={styles.content}>
                    {/* Icon */}
                    <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
                        <Typography style={styles.emoji}>{message.emoji}</Typography>
                    </View>

                    {/* Text */}
                    <View style={styles.textContainer}>
                        <Typography style={styles.title}>{message.title}</Typography>
                        <Typography style={styles.subtitle}>{message.subtitle}</Typography>
                    </View>

                    {/* CTA */}
                    <View style={[styles.ctaButton, { backgroundColor: theme.colors.primary }]}>
                        <Ionicons name="school" size={16} color="#FFFFFF" />
                    </View>
                </View>

                {/* Word count badge */}
                <View style={[styles.badge, { backgroundColor: theme.colors.primary + '15' }]}>
                    <Ionicons name="bookmark" size={12} color={theme.colors.primary} />
                    <Typography style={[styles.badgeText, { color: theme.colors.primary }]}>
                        {wordCount}
                    </Typography>
                </View>
            </View>
        </Pressable>
    )
}

const styles = StyleSheet.create((theme) => ({
    container: {
        marginHorizontal: theme.spacing.xl,
        marginBottom: theme.spacing.sm,
    },
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.primary + '20',
        ...theme.shadows.sm,
    },
    dismissButton: {
        position: 'absolute',
        top: theme.spacing.sm,
        right: theme.spacing.sm,
        zIndex: 2,
        width: 24,
        height: 24,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.backgroundSecondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: theme.radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emoji: {
        fontSize: 22,
    },
    textContainer: {
        flex: 1,
        marginLeft: theme.spacing.md,
    },
    title: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.text,
    },
    subtitle: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.xxs,
    },
    ctaButton: {
        width: 36,
        height: 36,
        borderRadius: theme.radius.sm + 2, // 10
        alignItems: 'center',
        justifyContent: 'center',
    },
    badge: {
        position: 'absolute',
        top: -6,
        left: theme.spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xxs + 1, // 3
        borderRadius: theme.radius.sm + 2, // 10
        gap: theme.spacing.xs,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
}))
