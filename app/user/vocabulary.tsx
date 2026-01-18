import React, { useState, useMemo } from 'react'
import { View, Text, TouchableOpacity, Animated } from 'react-native'
import { useTheme, Theme } from '@/theme';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { SearchBar, Typography } from '@/components'
import { VocabularyList } from '@/components/organisms/VocabularyList'
import { useVocabularyStore } from '@/store/vocabularyStore'
import { useAuthStore } from '@/store/authStore'
import { haptics } from '@/utils/haptics'
import { useTranslation } from 'react-i18next'

export default function VocabularyScreen() {
    const { t } = useTranslation()
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const router = useRouter()
    const insets = useSafeAreaInsets()
    const [searchQuery, setSearchQuery] = useState('')

    const { user } = useAuthStore()
    const { actions: vocabActions } = useVocabularyStore()

    const words = useMemo(() => {
        if (!user) return []
        return vocabActions.getWordsForUser(user.id)
    }, [user, vocabActions])

    const wordCount = words.length

    const handleStartQuiz = () => {
        haptics.medium()
        router.push('/user/quiz')
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                    hitSlop={12}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>{t('vocabulary.title', 'My Words')}</Text>
                {wordCount >= 3 ? (
                    <TouchableOpacity
                        onPress={handleStartQuiz}
                        style={styles.quizHeaderButton}
                        hitSlop={12}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="school" size={22} color={theme.colors.primary} />
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 40 }} />
                )}
            </View>

            {/* Quiz Banner - Only show if user has words */}
            {wordCount >= 3 && (
                <TouchableOpacity onPress={handleStartQuiz} style={styles.quizBannerWrapper} activeOpacity={0.9}>
                    <LinearGradient
                        colors={[theme.colors.primary, theme.colors.primaryDark || '#C62828']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.quizBanner}
                    >
                        <View style={styles.quizBannerContent}>
                            <View style={styles.quizIconContainer}>
                                <Text style={styles.quizIcon}>🎴</Text>
                            </View>
                            <View style={styles.quizTextContainer}>
                                <Typography style={styles.quizTitle}>
                                    Practice Your Words!
                                </Typography>
                                <Typography style={styles.quizSubtitle}>
                                    {wordCount} words ready to review
                                </Typography>
                            </View>
                            <View style={styles.quizArrow}>
                                <Ionicons name="play-circle" size={36} color="#FFFFFF" />
                            </View>
                        </View>

                        {/* Decorative elements */}
                        <View style={styles.decorCircle1} />
                        <View style={styles.decorCircle2} />
                    </LinearGradient>
                </TouchableOpacity>
            )}

            {/* Encouragement for new users */}
            {wordCount > 0 && wordCount < 3 && (
                <View style={styles.encouragementCard}>
                    <Text style={styles.encouragementIcon}>📚</Text>
                    <View style={styles.encouragementText}>
                        <Typography style={styles.encouragementTitle}>
                            {3 - wordCount} more to unlock Quiz!
                        </Typography>
                        <Typography style={styles.encouragementSubtitle}>
                            Save words while reading to practice
                        </Typography>
                    </View>
                    <View style={styles.progressDots}>
                        {[0, 1, 2].map(i => (
                            <View
                                key={i}
                                style={[
                                    styles.progressDot,
                                    i < wordCount && styles.progressDotFilled
                                ]}
                            />
                        ))}
                    </View>
                </View>
            )}

            {/* Search */}
            <View style={styles.searchSection}>
                <SearchBar
                    placeholder={t('vocabulary.searchPlaceholder', 'Search words...')}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onClear={() => setSearchQuery('')}
                />
            </View>

            {/* List */}
            <View style={styles.content}>
                <VocabularyList
                    searchQuery={searchQuery}
                    onWordPress={(item) => {
                        haptics.selection()
                    }}
                />
            </View>
        </View>
    )
}

const createStyles = (theme: Theme) => StyleSheet.create({
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
        backgroundColor: theme.colors.background,
        zIndex: 100,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.full,
        ...theme.shadows.sm,
    },
    title: {
        fontSize: theme.typography.size.xl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    quizBannerWrapper: {
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.md,
    },
    quizBanner: {
        borderRadius: theme.radius.xxl,
        padding: theme.spacing.lg,
        overflow: 'hidden',
        position: 'relative',
    },
    quizBannerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 1,
    },
    quizIconContainer: {
        width: 48,
        height: 48,
        borderRadius: theme.radius.md,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    quizIcon: {
        fontSize: theme.typography.size.xxl,
    },
    quizTextContainer: {
        flex: 1,
        marginLeft: theme.spacing.md,
    },
    quizTitle: {
        fontSize: theme.typography.size.md,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    quizSubtitle: {
        fontSize: theme.typography.size.xs,
        color: 'rgba(255,255,255,0.8)',
        marginTop: theme.spacing.xxs,
    },
    quizArrow: {
        opacity: 0.9,
    },
    decorCircle1: {
        position: 'absolute',
        top: -30,
        right: -30,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    decorCircle2: {
        position: 'absolute',
        bottom: -20,
        left: 60,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    encouragementCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        padding: theme.spacing.md,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.primary + '30',
        ...theme.shadows.sm,
    },
    encouragementIcon: {
        fontSize: theme.typography.size.xxxl,
    },
    encouragementText: {
        flex: 1,
        marginLeft: theme.spacing.md,
    },
    encouragementTitle: {
        fontSize: theme.typography.size.sm,
        fontWeight: '600',
        color: theme.colors.text,
    },
    encouragementSubtitle: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.xxs,
    },
    progressDots: {
        flexDirection: 'row',
        gap: theme.spacing.xs,
    },
    progressDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: theme.colors.backgroundSecondary,
    },
    progressDotFilled: {
        backgroundColor: theme.colors.primary,
    },
    searchSection: {
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.md,
    },
    content: {
        flex: 1,
        paddingHorizontal: theme.spacing.lg,
    },
    quizHeaderButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primary + '15',
        borderRadius: theme.radius.full,
    },
});
