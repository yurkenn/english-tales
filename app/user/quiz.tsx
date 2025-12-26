import React, { useState, useMemo, useCallback } from 'react'
import { View, ScrollView, Pressable, Animated } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { Typography } from '@/components/atoms'
import { FlashCard } from '@/components/molecules/FlashCard'
import { useVocabularyStore, SavedWord } from '@/store/vocabularyStore'
import { useAuthStore } from '@/store/authStore'
import { haptics } from '@/utils/haptics'

type QuizMode = 'flashcard' | 'multiple_choice'

export default function VocabularyQuizScreen() {
    const { theme } = useUnistyles()
    const { t } = useTranslation()
    const router = useRouter()
    const insets = useSafeAreaInsets()

    const { user } = useAuthStore()
    const { actions: vocabActions } = useVocabularyStore()

    const words = useMemo(() => {
        if (!user) return []
        return vocabActions.getWordsForUser(user.id)
    }, [user, vocabActions])

    const [currentIndex, setCurrentIndex] = useState(0)
    const [correctCount, setCorrectCount] = useState(0)
    const [incorrectCount, setIncorrectCount] = useState(0)
    const [isComplete, setIsComplete] = useState(false)

    // Shuffle words for quiz
    const shuffledWords = useMemo(() => {
        return [...words].sort(() => Math.random() - 0.5)
    }, [words])

    const currentWord = shuffledWords[currentIndex]

    const handleCorrect = useCallback(() => {
        setCorrectCount(c => c + 1)
        goToNext()
    }, [currentIndex, shuffledWords.length])

    const handleIncorrect = useCallback(() => {
        setIncorrectCount(c => c + 1)
        goToNext()
    }, [currentIndex, shuffledWords.length])

    const goToNext = () => {
        if (currentIndex < shuffledWords.length - 1) {
            setCurrentIndex(i => i + 1)
        } else {
            setIsComplete(true)
            haptics.success()
        }
    }

    const handleRestart = () => {
        setCurrentIndex(0)
        setCorrectCount(0)
        setIncorrectCount(0)
        setIsComplete(false)
    }

    // Empty state
    if (words.length === 0) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <View style={styles.header}>
                    <Pressable style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                    </Pressable>
                    <Typography style={styles.headerTitle}>Vocabulary Quiz</Typography>
                    <View style={styles.placeholder} />
                </View>
                <View style={styles.emptyState}>
                    <Typography style={styles.emptyIcon}>📚</Typography>
                    <Typography style={styles.emptyTitle}>No Words Yet</Typography>
                    <Typography style={styles.emptyText}>
                        Save some words while reading to start practicing!
                    </Typography>
                    <Pressable
                        style={styles.emptyButton}
                        onPress={() => router.push('/(tabs)')}
                    >
                        <Typography style={styles.emptyButtonText}>Start Reading</Typography>
                    </Pressable>
                </View>
            </View>
        )
    }

    // Complete state
    if (isComplete) {
        const score = Math.round((correctCount / shuffledWords.length) * 100)
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <View style={styles.header}>
                    <Pressable style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                    </Pressable>
                    <Typography style={styles.headerTitle}>Quiz Complete!</Typography>
                    <View style={styles.placeholder} />
                </View>
                <View style={styles.completeContainer}>
                    <View style={styles.scoreCircle}>
                        <Typography style={styles.scorePercent}>{score}%</Typography>
                        <Typography style={styles.scoreLabel}>Score</Typography>
                    </View>
                    <View style={styles.statsRow}>
                        <View style={[styles.statBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                            <Typography style={[styles.statValue, { color: '#10B981' }]}>{correctCount}</Typography>
                            <Typography style={styles.statLabel}>Correct</Typography>
                        </View>
                        <View style={[styles.statBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                            <Ionicons name="close-circle" size={24} color="#EF4444" />
                            <Typography style={[styles.statValue, { color: '#EF4444' }]}>{incorrectCount}</Typography>
                            <Typography style={styles.statLabel}>Learning</Typography>
                        </View>
                    </View>
                    <Pressable style={styles.restartButton} onPress={handleRestart}>
                        <Ionicons name="refresh" size={20} color="#FFFFFF" />
                        <Typography style={styles.restartButtonText}>Practice Again</Typography>
                    </Pressable>
                </View>
            </View>
        )
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </Pressable>
                <Typography style={styles.headerTitle}>Vocabulary Quiz</Typography>
                <View style={styles.placeholder} />
            </View>

            {/* Progress */}
            <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                    <View
                        style={[
                            styles.progressFill,
                            { width: `${((currentIndex + 1) / shuffledWords.length) * 100}%` }
                        ]}
                    />
                </View>
                <Typography style={styles.progressText}>
                    {currentIndex + 1} / {shuffledWords.length}
                </Typography>
            </View>

            {/* Flashcard */}
            {currentWord && (
                <FlashCard
                    key={currentWord.id}
                    word={currentWord.word}
                    definition={currentWord.definition}
                    example={currentWord.example}
                    partOfSpeech={currentWord.partOfSpeech}
                    onCorrect={handleCorrect}
                    onIncorrect={handleIncorrect}
                />
            )}
        </View>
    )
}

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surface,
    },
    headerTitle: {
        fontSize: theme.typography.size.lg,
        fontWeight: '700',
        color: theme.colors.text,
    },
    placeholder: {
        width: 40,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.md,
        gap: theme.spacing.md,
    },
    progressBar: {
        flex: 1,
        height: 6,
        backgroundColor: theme.colors.backgroundSecondary,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: theme.colors.primary,
        borderRadius: 3,
    },
    progressText: {
        fontSize: theme.typography.size.xs,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        minWidth: 50,
        textAlign: 'right',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.xxxxl,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: theme.spacing.lg,
    },
    emptyTitle: {
        fontSize: theme.typography.size.xl,
        fontWeight: '700',
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
    },
    emptyText: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: theme.spacing.xl,
    },
    emptyButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: theme.spacing.xxl,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.radius.md,
    },
    emptyButtonText: {
        fontSize: theme.typography.size.sm,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    completeContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.xxl,
    },
    scoreCircle: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.xxxxl,
        ...theme.shadows.lg,
    },
    scorePercent: {
        fontSize: 48,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    scoreLabel: {
        fontSize: theme.typography.size.sm,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.8)',
    },
    statsRow: {
        flexDirection: 'row',
        gap: theme.spacing.lg,
        marginBottom: theme.spacing.xxxxl,
    },
    statBox: {
        width: 120,
        paddingVertical: theme.spacing.lg,
        borderRadius: theme.radius.lg,
        alignItems: 'center',
        gap: theme.spacing.xs,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
    },
    statLabel: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.textSecondary,
    },
    restartButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primary,
        paddingHorizontal: theme.spacing.xxl,
        paddingVertical: theme.spacing.lg,
        borderRadius: theme.radius.lg,
        gap: theme.spacing.sm,
    },
    restartButtonText: {
        fontSize: theme.typography.size.md,
        fontWeight: '600',
        color: '#FFFFFF',
    },
}))
