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
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        backgroundColor: theme.colors.surface,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text,
    },
    placeholder: {
        width: 40,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 12,
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
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        minWidth: 50,
        textAlign: 'right',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
    },
    emptyButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    emptyButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    completeContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    scoreCircle: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
        ...theme.shadows.lg,
    },
    scorePercent: {
        fontSize: 48,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    scoreLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.8)',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 32,
    },
    statBox: {
        width: 120,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        gap: 4,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
    },
    statLabel: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    restartButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 14,
        gap: 8,
    },
    restartButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
    },
}))
