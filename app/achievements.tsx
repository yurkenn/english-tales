import React, { useState, useCallback } from 'react'
import { View, ScrollView, Pressable, Animated } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { Typography } from '@/components/atoms'
import { AchievementCard, AchievementsProgressCard } from '@/components'
import { useAchievementsStore, AchievementCategory, CATEGORY_ICONS } from '@/store/achievementsStore'
import { haptics } from '@/utils/haptics'

type FilterType = 'all' | AchievementCategory

const FILTERS: { key: FilterType; label: string; icon?: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'reading', label: 'Reading', icon: CATEGORY_ICONS.reading },
    { key: 'streak', label: 'Streak', icon: CATEGORY_ICONS.streak },
    { key: 'social', label: 'Social', icon: CATEGORY_ICONS.social },
]

export default function AchievementsScreen() {
    const { theme } = useUnistyles()
    const { t } = useTranslation()
    const router = useRouter()
    const insets = useSafeAreaInsets()
    const { actions: achievementActions } = useAchievementsStore()

    const [activeFilter, setActiveFilter] = useState<FilterType>('all')

    const allAchievements = achievementActions.getAll()
    const filteredAchievements = activeFilter === 'all'
        ? allAchievements
        : achievementActions.getByCategory(activeFilter)

    const unlockedCount = allAchievements.filter(a => a.unlocked).length
    const totalCount = allAchievements.length

    const handleFilterChange = useCallback((filter: FilterType) => {
        haptics.selection()
        setActiveFilter(filter)
    }, [])

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable
                    style={styles.backButton}
                    onPress={() => {
                        haptics.selection()
                        router.back()
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </Pressable>
                <Typography style={styles.headerTitle}>
                    {t('achievements.title', 'Achievements')}
                </Typography>
                <View style={styles.placeholder} />
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterScroll}
                >
                    {FILTERS.map(filter => {
                        const isActive = activeFilter === filter.key
                        return (
                            <Pressable
                                key={filter.key}
                                style={[
                                    styles.filterTab,
                                    isActive && styles.filterTabActive,
                                ]}
                                onPress={() => handleFilterChange(filter.key)}
                            >
                                {filter.icon && (
                                    <Typography style={styles.filterIcon}>{filter.icon}</Typography>
                                )}
                                <Typography
                                    style={[
                                        styles.filterLabel,
                                        isActive && styles.filterLabelActive,
                                    ]}
                                >
                                    {filter.label}
                                </Typography>
                            </Pressable>
                        )
                    })}
                </ScrollView>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
            >
                {/* Progress Card - only show on "All" filter */}
                {activeFilter === 'all' && (
                    <AchievementsProgressCard
                        unlockedCount={unlockedCount}
                        totalCount={totalCount}
                    />
                )}

                {/* Achievements Grid */}
                <View style={styles.grid}>
                    {filteredAchievements.map((achievement, index) => (
                        <AchievementCard
                            key={achievement.id}
                            achievement={achievement}
                        />
                    ))}
                </View>

                {/* Empty state for filtered view */}
                {filteredAchievements.length === 0 && (
                    <View style={styles.emptyState}>
                        <Typography style={styles.emptyIcon}>🏆</Typography>
                        <Typography style={styles.emptyText}>
                            No achievements in this category yet
                        </Typography>
                    </View>
                )}
            </ScrollView>
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
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text,
    },
    placeholder: {
        width: 40,
    },
    filterContainer: {
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    filterScroll: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    filterTab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.radius.xl,
        backgroundColor: theme.colors.surface,
        gap: theme.spacing.sm,
        marginRight: theme.spacing.sm,
    },
    filterTabActive: {
        backgroundColor: theme.colors.primary,
    },
    filterIcon: {
        fontSize: 14,
    },
    filterLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.textSecondary,
    },
    filterLabelActive: {
        color: '#FFFFFF',
    },
    content: {
        padding: theme.spacing.lg,
        paddingBottom: theme.spacing.xxxxl,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.md,
        justifyContent: 'space-between',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: theme.spacing.xxxxl,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: theme.spacing.md,
    },
    emptyText: {
        fontSize: 14,
        color: theme.colors.textMuted,
    },
}))
