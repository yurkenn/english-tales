import React from 'react'
import { View } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'
import { Ionicons } from '@expo/vector-icons'
import { Typography } from '@/components/atoms'
import { AchievementCategory, CATEGORY_ICONS, useAchievementsStore } from '@/store/achievementsStore'

interface AchievementsProgressCardProps {
    unlockedCount: number
    totalCount: number
}

const CATEGORIES: { key: AchievementCategory; label: string; color: string }[] = [
    { key: 'reading', label: 'Reading', color: '#3B82F6' },
    { key: 'streak', label: 'Streak', color: '#F59E0B' },
    { key: 'social', label: 'Social', color: '#8B5CF6' },
]

export const AchievementsProgressCard: React.FC<AchievementsProgressCardProps> = ({
    unlockedCount,
    totalCount,
}) => {
    const { theme } = useUnistyles()
    const { actions } = useAchievementsStore()
    const progress = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.trophyContainer}>
                        <Ionicons name="trophy" size={24} color="#F59E0B" />
                    </View>
                    <View>
                        <Typography style={styles.title}>Your Progress</Typography>
                        <Typography style={styles.subtitle}>
                            {unlockedCount === totalCount ? 'All complete!' : 'Keep going!'}
                        </Typography>
                    </View>
                </View>
                <View style={styles.countContainer}>
                    <Typography style={styles.countValue}>{unlockedCount}</Typography>
                    <Typography style={styles.countDivider}>/</Typography>
                    <Typography style={styles.countTotal}>{totalCount}</Typography>
                </View>
            </View>

            {/* Main progress bar */}
            <View style={styles.mainProgressContainer}>
                <View style={styles.barContainer}>
                    <View style={[styles.bar, { width: `${progress}%` }]} />
                </View>
                <Typography style={styles.percentText}>{Math.round(progress)}%</Typography>
            </View>

            {/* Category breakdown */}
            <View style={styles.categoriesContainer}>
                {CATEGORIES.map(cat => {
                    const catProgress = actions.getCategoryProgress(cat.key)
                    const catPercent = catProgress.total > 0
                        ? (catProgress.unlocked / catProgress.total) * 100
                        : 0

                    return (
                        <View key={cat.key} style={styles.categoryItem}>
                            <View style={styles.categoryHeader}>
                                <Typography style={styles.categoryIcon}>{CATEGORY_ICONS[cat.key]}</Typography>
                                <Typography style={styles.categoryLabel}>{cat.label}</Typography>
                                <Typography style={styles.categoryCount}>
                                    {catProgress.unlocked}/{catProgress.total}
                                </Typography>
                            </View>
                            <View style={styles.categoryBarContainer}>
                                <View
                                    style={[
                                        styles.categoryBar,
                                        { width: `${catPercent}%`, backgroundColor: cat.color },
                                    ]}
                                />
                            </View>
                        </View>
                    )
                })}
            </View>
        </View>
    )
}

const styles = StyleSheet.create((theme) => ({
    container: {
        backgroundColor: theme.colors.surface,
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        ...theme.shadows.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    trophyContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text,
    },
    subtitle: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    countContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    countValue: {
        fontSize: 28,
        fontWeight: '800',
        color: theme.colors.primary,
    },
    countDivider: {
        fontSize: 18,
        color: theme.colors.textMuted,
        marginHorizontal: 2,
    },
    countTotal: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.textMuted,
    },
    mainProgressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 20,
    },
    barContainer: {
        flex: 1,
        height: 10,
        backgroundColor: theme.colors.backgroundSecondary,
        borderRadius: 5,
        overflow: 'hidden',
    },
    bar: {
        height: '100%',
        backgroundColor: theme.colors.primary,
        borderRadius: 5,
    },
    percentText: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.primary,
        minWidth: 40,
        textAlign: 'right',
    },
    categoriesContainer: {
        gap: 12,
    },
    categoryItem: {
        gap: 6,
    },
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    categoryIcon: {
        fontSize: 14,
    },
    categoryLabel: {
        flex: 1,
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.textSecondary,
    },
    categoryCount: {
        fontSize: 11,
        fontWeight: '600',
        color: theme.colors.textMuted,
    },
    categoryBarContainer: {
        height: 4,
        backgroundColor: theme.colors.backgroundSecondary,
        borderRadius: 2,
        overflow: 'hidden',
    },
    categoryBar: {
        height: '100%',
        borderRadius: 2,
    },
}))
