import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { View, Pressable, Linking, ScrollView } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'

import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import BottomSheet from '@gorhom/bottom-sheet'
import { useTranslation } from 'react-i18next'

import { Typography } from '../../components/atoms'
import { ProfileHeader } from '../../components/organisms/ProfileHeader'
import { ProfileTabs, ProfileTabType } from '../../components/molecules/ProfileTabs'
import { ReadingGoalsSheet } from '../../components/organisms/ReadingGoalsSheet'
import { ReadingCalendar } from '../../components/organisms/ReadingCalendar'
import { InsightsCard } from '../../components/organisms/InsightsCard'
import { WordGrowthChart } from '../../components/organisms/WordGrowthChart'
import { ProfileMenu, MenuItem } from '../../components/organisms/ProfileMenu'
import { CommunityPostCard } from '../../components/organisms/CommunityPostCard'
import { StoryGridCard } from '../../components/molecules/StoryGridCard'
import { ActionSheet } from '../../components/molecules/ActionSheet'
import { GuestLoginBanner } from '../../components/molecules/GuestLoginBanner'
import { ProfileScreenSkeleton } from '../../components/skeletons/ProfileScreenSkeleton'

import { useAuthStore } from '@/store/authStore'
import { useLibraryStore } from '@/store/libraryStore'
import { useProgressStore } from '@/store/progressStore'
import { useThemeStore } from '@/store/themeStore'
import { useAchievementsStore } from '@/store/achievementsStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useToastStore } from '@/store/toastStore'
import { useVocabularyStore } from '@/store/vocabularyStore'
import { userService } from '@/services/userService'
import { communityService } from '@/services/communityService'
import { UserProfile, CommunityPost } from '@/types'
import { haptics } from '@/utils/haptics'

// Constants
const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'tr', label: 'Türkçe' },
    { code: 'es', label: 'Español' },
    { code: 'de', label: 'Deutsch' },
    { code: 'fr', label: 'Français' },
]

// Empty State Component
const EmptyState = ({ icon, message }: { icon: keyof typeof Ionicons.glyphMap; message: string }) => {
    const { theme } = useUnistyles()
    return (
        <View style={styles.emptyContainer}>
            <Ionicons name={icon} size={64} color={theme.colors.border} />
            <Typography color={theme.colors.textMuted} style={styles.emptyText}>
                {message}
            </Typography>
        </View>
    )
}

export default function ProfileScreen() {
    const { t } = useTranslation()
    const { theme } = useUnistyles()
    const router = useRouter()
    const insets = useSafeAreaInsets()

    // Stores
    const { user, signOut, isLoading: authLoading } = useAuthStore()
    const { items: libraryItems } = useLibraryStore()
    const { progressMap, totalReadingTimeMs, actions: progressActions } = useProgressStore()
    const { savedWords } = useVocabularyStore()
    const { settings, actions: settingsActions } = useSettingsStore()
    const { mode: themeMode, actions: themeActions } = useThemeStore()
    const { actions: achievementActions } = useAchievementsStore()
    const toast = useToastStore()

    // State
    const [activeTab, setActiveTab] = useState<ProfileTabType>('posts')
    const [fullProfile, setFullProfile] = useState<UserProfile | null>(null)
    const [myPosts, setMyPosts] = useState<CommunityPost[]>([])
    const [loadingProfile, setLoadingProfile] = useState(true)
    const [showGuestBanner, setShowGuestBanner] = useState(true)

    // Refs
    const goalsSheetRef = useRef<BottomSheet>(null)
    const langSheetRef = useRef<BottomSheet>(null)

    // Initial load
    useEffect(() => {
        const loadInitialData = async () => {
            if (!user) return
            setLoadingProfile(true)

            const [profileRes, postsRes] = await Promise.all([
                userService.getUserProfile(user.id),
                communityService.getPostsByUser(user.id),
            ])

            if (profileRes.success) setFullProfile(profileRes.data)
            if (postsRes.success) setMyPosts(postsRes.data)

            setLoadingProfile(false)
        }
        loadInitialData()
        settingsActions.loadSettings()
    }, [user, settingsActions])

    // Stats
    const stats = useMemo(() => {
        let booksRead = 0
        Object.values(progressMap).forEach((p) => { if (p.isCompleted) booksRead++ })
        const userWords = user?.id ? (savedWords[user.id] || {}) : {}

        return {
            booksRead,
            streak: progressActions.getStreak(),
            postsCount: myPosts.length,
            vocabCount: Object.keys(userWords).length,
        }
    }, [progressMap, myPosts, savedWords, user?.id, progressActions])

    // Menu items
    const achievements = achievementActions.getAll()
    const unlockedCount = achievements.filter((a) => a.unlocked).length
    const themeModeLabel = themeMode === 'system' ? t('appearance.system') : themeMode === 'light' ? t('appearance.light') : t('appearance.dark')
    const currentLanguageLabel = LANGUAGES.find((l) => l.code === (settings.language || 'en'))?.label || 'English'

    const menuItems = useMemo<MenuItem[]>(() => [
        { label: t('profile.readingGoals'), icon: 'flag-outline', value: `${settings.dailyGoalMinutes} min/day`, onPress: () => { haptics.selection(); goalsSheetRef.current?.expand() } },
        { label: t('profile.achievements'), icon: 'trophy-outline', value: `${unlockedCount}/${achievements.length}`, onPress: () => { haptics.selection(); router.push('/achievements') } },
        { label: t('social.following', 'Following'), icon: 'people-outline', onPress: () => { haptics.selection(); router.push('/social' as any) } },
        { label: t('profile.vocabulary', 'Vocabulary'), icon: 'bookmark-outline', value: `${stats.vocabCount} words`, onPress: () => { haptics.selection(); router.push('/user/vocabulary') } },
        { label: t('profile.language'), icon: 'language-outline', value: currentLanguageLabel, onPress: () => { haptics.selection(); langSheetRef.current?.expand() } },
        { label: t('profile.appearance'), icon: 'color-palette-outline', value: themeModeLabel, onPress: themeActions.toggleTheme },
    ], [t, settings.dailyGoalMinutes, unlockedCount, achievements.length, stats.vocabCount, currentLanguageLabel, themeModeLabel, router, themeActions])

    // Handlers
    const handleSignOut = useCallback(() => {
        haptics.warning()
        signOut()
    }, [signOut])

    const handleSettingsPress = useCallback(() => {
        haptics.selection()
        router.push('/settings')
    }, [router])

    const handleEditPress = useCallback(() => {
        haptics.selection()
        router.push('/user/edit')
    }, [router])

    // Tab content renderer
    const renderTabContent = useCallback(() => {
        switch (activeTab) {
            case 'posts':
                return (
                    <View style={styles.tabContent}>
                        {myPosts.length === 0 ? (
                            <EmptyState icon="chatbubble-ellipses-outline" message="No posts yet. Share something with the community!" />
                        ) : (
                            myPosts.map((post) => (
                                <CommunityPostCard
                                    key={post.id}
                                    post={post}
                                    currentUserId={user?.id}
                                    onLike={() => { }}
                                    onReply={() => { }}
                                />
                            ))
                        )}
                    </View>
                )
            case 'reviews':
                return (
                    <View style={styles.tabContent}>
                        <EmptyState icon="star-outline" message="No reviews written yet. Rate some stories to see them here!" />
                    </View>
                )
            case 'library':
                return (
                    <View style={styles.tabContent}>
                        {libraryItems.length === 0 ? (
                            <EmptyState icon="library-outline" message="Your library is empty. Save stories to read them later!" />
                        ) : (
                            <View style={styles.grid}>
                                {libraryItems.map((item) => (
                                    <StoryGridCard
                                        key={item.storyId}
                                        story={item.story}
                                        isInLibrary
                                        onPress={() => router.push(`/story/${item.storyId}`)}
                                    />
                                ))}
                            </View>
                        )}
                    </View>
                )
            case 'more':
                return (
                    <View style={styles.tabContent}>
                        <View style={styles.sectionHeader}>
                            <Typography variant="h3">{t('profile.learningInsights', 'Learning Insights')}</Typography>
                        </View>
                        <InsightsCard wordsLearned={stats.vocabCount} averageAccuracy={0} totalReadingTimeMs={totalReadingTimeMs} />
                        <View style={styles.calendarWrapper}>
                            <ReadingCalendar readingData={{}} />
                        </View>
                        <WordGrowthChart words={Object.values(user?.id ? (savedWords[user.id] || {}) : {})} />

                        <View style={styles.sectionDivider} />
                        <View style={styles.sectionHeader}>
                            <Typography variant="h3">{t('settings.title', 'Settings')}</Typography>
                        </View>
                        <ProfileMenu items={menuItems} />

                        <Pressable style={styles.signOutButton} onPress={handleSignOut}>
                            <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
                            <Typography variant="bodyBold" color={theme.colors.error}>Sign Out</Typography>
                        </Pressable>
                    </View>
                )
            default:
                return null
        }
    }, [activeTab, myPosts, libraryItems, user?.id, savedWords, stats.vocabCount, totalReadingTimeMs, menuItems, router, handleSignOut, theme.colors.error, t])

    // Loading state
    if (authLoading || loadingProfile) {
        return <ProfileScreenSkeleton />
    }

    // No user state
    if (!user || !fullProfile) return null

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <Typography variant="h2" style={styles.headerTitle}>
                    {t('tabs.profile', 'Profile')}
                </Typography>
                <Pressable style={styles.headerAction} onPress={handleSettingsPress}>
                    <Ionicons name="settings-outline" size={22} color={theme.colors.text} />
                </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Guest Login Banner */}
                {user?.isAnonymous && showGuestBanner && (
                    <GuestLoginBanner
                        onSignInPress={() => router.push('/login')}
                        onDismiss={() => setShowGuestBanner(false)}
                    />
                )}

                <ProfileHeader
                    profile={{
                        ...fullProfile,
                        followersCount: fullProfile.followersCount || 0,
                        followingCount: fullProfile.followingCount || 0,
                        streak: stats.streak,
                    }}
                    isSelf
                    onEditPress={handleEditPress}
                />

                <View style={styles.tabsWrapper}>
                    <ProfileTabs
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        counts={{ posts: stats.postsCount, library: libraryItems.length }}
                    />
                </View>

                {renderTabContent()}
            </ScrollView>

            <ReadingGoalsSheet
                ref={goalsSheetRef}
                currentGoal={settings.dailyGoalMinutes}
                onSelectGoal={(min) => settingsActions.updateSettings({ dailyGoalMinutes: min })}
                onClose={() => goalsSheetRef.current?.close()}
            />

            <ActionSheet
                ref={langSheetRef}
                title={t('settings.preferences.language')}
                options={LANGUAGES.map((lang) => ({
                    label: lang.label,
                    icon: settings.language === lang.code ? 'checkmark-circle' : 'ellipse-outline',
                    onPress: () => {
                        haptics.success()
                        settingsActions.updateSettings({ language: lang.code as any })
                    },
                }))}
                onClose={() => langSheetRef.current?.close()}
            />
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
        paddingHorizontal: 20,
        paddingBottom: 12,
        backgroundColor: theme.colors.background,
    },
    headerTitle: {
        fontSize: theme.typography.size.xxxl,
        fontWeight: 'bold',
        color: theme.colors.text,
        letterSpacing: -0.5,
    },
    headerAction: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.sm,
    },
    scrollContent: {
        paddingBottom: 120,
    },
    tabsWrapper: {
        backgroundColor: theme.colors.background,
    },
    tabContent: {
        paddingTop: theme.spacing.md,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyText: {
        textAlign: 'center',
        fontSize: theme.typography.size.md,
        lineHeight: 24,
        marginTop: 16,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: theme.spacing.lg,
        gap: 16,
        paddingTop: 8,
    },

    sectionDivider: {
        height: 12,
        backgroundColor: theme.colors.surfaceElevated,
        marginVertical: theme.spacing.xxl,
    },
    sectionHeader: {
        paddingHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
    },
    calendarWrapper: {
        marginVertical: 12,
    },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        marginVertical: 60,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        marginHorizontal: theme.spacing.lg,
        borderRadius: 16,
        backgroundColor: theme.colors.surface,
    },
}))
