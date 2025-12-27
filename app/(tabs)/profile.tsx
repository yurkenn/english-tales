import React, { useCallback } from 'react'
import { View, Pressable, ScrollView, Image } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'

import { Typography, ProfileTabButton, ProfileStatItem, CoinDisplay } from '../../components/atoms'
import { CommunityPostCard } from '../../components/organisms/CommunityPostCard'
import { StoryGridCard } from '../../components/molecules/StoryGridCard'
import { GuestLoginBanner } from '../../components/molecules/GuestLoginBanner'
import { EmptyState } from '../../components/molecules/EmptyState'
import { ProfileScreenSkeleton } from '../../components/skeletons/ProfileScreenSkeleton'
import { ReadingGoalsSheet } from '../../components/organisms/ReadingGoalsSheet'
import { ActionSheet } from '../../components/molecules/ActionSheet'
import { DailyGoalCard } from '../../components/molecules/DailyGoalCard'

import { useLibraryStore } from '@/store/libraryStore'
import { useProgressStore } from '@/store/progressStore'
import { haptics } from '@/utils/haptics'
import { useProfileDataManager, useProfileStatsManager, useProfileUIController } from '@/hooks'

const DEFAULT_AVATAR = require('@/assets/defaultavatar.png')

// Menu Item Component
const MenuItem = ({
    icon,
    label,
    value,
    onPress,
    isLast = false
}: {
    icon: string
    label: string
    value?: string
    onPress: () => void
    isLast?: boolean
}) => {
    const { theme } = useUnistyles()
    return (
        <Pressable
            style={[styles.menuItem, !isLast && styles.menuItemBorder]}
            onPress={() => { haptics.selection(); onPress() }}
            android_ripple={{ color: theme.colors.primary + '10' }}
        >
            <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconWrapper, { backgroundColor: theme.colors.primary + '15' }]}>
                    <Ionicons name={icon as any} size={18} color={theme.colors.primary} />
                </View>
                <Typography style={styles.menuItemLabel}>{label}</Typography>
            </View>
            <View style={styles.menuItemRight}>
                {value && (
                    <Typography style={styles.menuItemValue}>{value}</Typography>
                )}
                <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
            </View>
        </Pressable>
    )
}

export default function ProfileScreen() {
    const { t } = useTranslation()
    const { theme } = useUnistyles()
    const insets = useSafeAreaInsets()

    // Stores
    const { items: libraryItems } = useLibraryStore()
    const { todayStats } = useProgressStore()

    // Hooks
    const { user, fullProfile, myPosts, loadingProfile } = useProfileDataManager()
    const {
        stats,
        achievements,
        unlockedCount,
        themeModeLabel,
        currentLanguageLabel,
        settings,
        LANGUAGES
    } = useProfileStatsManager(user, myPosts)

    const {
        activeTab,
        showGuestBanner,
        setShowGuestBanner,
        goalsSheetRef,
        langSheetRef,
        handleSettingsPress,
        handleEditPress,
        handleTabChange,
        handleSignOut,
        handleFollowersPress,
        themeActions,
        settingsActions,
        progressActions,
        router
    } = useProfileUIController()

    // Tab content renderer
    const renderTabContent = useCallback(() => {
        switch (activeTab) {
            case 'posts':
                return myPosts.length === 0 ? (
                    <EmptyState
                        icon="chatbubble-ellipses-outline"
                        title={t('profile.noPosts', 'No posts yet')}
                        message={t('profile.noPostsMessage', 'Share your reading journey with the community!')}
                        actionLabel={t('profile.shareFirst', 'Create Post')}
                        onAction={() => router.push('/(tabs)/community')}
                    />
                ) : (
                    <View style={styles.feedContainer}>
                        {myPosts.map((post) => (
                            <CommunityPostCard
                                key={post.id}
                                post={post}
                                currentUserId={user?.id}
                                onLike={() => { }}
                                onReply={() => { }}
                            />
                        ))}
                    </View>
                )

            case 'saved':
                return libraryItems.length === 0 ? (
                    <EmptyState
                        icon="bookmark-outline"
                        title={t('profile.emptyLibrary', 'Nothing saved yet')}
                        message={t('profile.emptyLibraryMessage', 'Save stories to easily find them here!')}
                        actionLabel={t('profile.exploreStories', 'Explore Stories')}
                        onAction={() => router.push('/(tabs)/discover')}
                    />
                ) : (
                    <View style={styles.savedGrid}>
                        {libraryItems.map((item) => (
                            <StoryGridCard
                                key={item.storyId}
                                story={item.story}
                                isInLibrary
                                onPress={() => router.push(`/story/${item.storyId}`)}
                            />
                        ))}
                    </View>
                )

            case 'about':
                return (
                    <View style={styles.aboutContainer}>
                        {/* Quick Stats */}
                        <View style={styles.quickStatsCard}>
                            <View style={styles.quickStatsRow}>
                                <View style={styles.quickStatItem}>
                                    <View style={[styles.quickStatIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                                        <Ionicons name="book" size={18} color={theme.colors.primary} />
                                    </View>
                                    <Typography style={styles.quickStatValue}>{Math.round(stats.booksRead)}</Typography>
                                    <Typography style={styles.quickStatLabel}>{t('profile.books', 'Books')}</Typography>
                                </View>
                                <View style={styles.quickStatItem}>
                                    <View style={[styles.quickStatIcon, { backgroundColor: '#F59E0B15' }]}>
                                        <Ionicons name="time" size={18} color="#F59E0B" />
                                    </View>
                                    <Typography style={styles.quickStatValue}>{Math.round(stats.readingHours)}h</Typography>
                                    <Typography style={styles.quickStatLabel}>{t('profile.reading', 'Hours')}</Typography>
                                </View>
                                <View style={styles.quickStatItem}>
                                    <View style={[styles.quickStatIcon, { backgroundColor: '#10B98115' }]}>
                                        <Ionicons name="text" size={18} color="#10B981" />
                                    </View>
                                    <Typography style={styles.quickStatValue}>{Math.round(stats.vocabCount)}</Typography>
                                    <Typography style={styles.quickStatLabel}>{t('profile.words', 'Words')}</Typography>
                                </View>
                                <View style={styles.quickStatItem}>
                                    <View style={[styles.quickStatIcon, { backgroundColor: '#8B5CF615' }]}>
                                        <Ionicons name="trophy" size={18} color="#8B5CF6" />
                                    </View>
                                    <Typography style={styles.quickStatValue}>{unlockedCount}</Typography>
                                    <Typography style={styles.quickStatLabel}>{t('profile.badges', 'Badges')}</Typography>
                                </View>
                            </View>
                        </View>

                        {/* Activity Menu */}
                        <View style={styles.menuSection}>
                            <Typography style={styles.menuSectionTitle}>{t('profile.activity', 'Activity')}</Typography>
                            <View style={styles.menuCard}>
                                <MenuItem
                                    icon="trophy-outline"
                                    label={t('profile.achievements')}
                                    value={`${unlockedCount}/${achievements.length}`}
                                    onPress={() => router.push('/achievements')}
                                />
                                <MenuItem
                                    icon="bookmark-outline"
                                    label={t('profile.vocabulary')}
                                    value={`${stats.vocabCount}`}
                                    onPress={() => router.push('/user/vocabulary')}
                                />
                                <MenuItem
                                    icon="school-outline"
                                    label={t('profile.quiz', 'Practice Quiz')}
                                    onPress={() => router.push('/user/quiz')}
                                />
                                <MenuItem
                                    icon="people-outline"
                                    label={t('social.following')}
                                    onPress={() => router.push('/social' as any)}
                                    isLast
                                />
                            </View>
                        </View>

                        {/* Settings Menu */}
                        <View style={styles.menuSection}>
                            <Typography style={styles.menuSectionTitle}>{t('profile.preferences', 'Preferences')}</Typography>
                            <View style={styles.menuCard}>
                                <MenuItem
                                    icon="flag-outline"
                                    label={t('profile.readingGoals')}
                                    value={`${settings.dailyGoalMinutes} min`}
                                    onPress={() => goalsSheetRef.current?.expand()}
                                />
                                <MenuItem
                                    icon="language-outline"
                                    label={t('profile.language')}
                                    value={currentLanguageLabel}
                                    onPress={() => langSheetRef.current?.expand()}
                                />
                                <MenuItem
                                    icon="color-palette-outline"
                                    label={t('profile.appearance')}
                                    value={themeModeLabel}
                                    onPress={themeActions.toggleTheme}
                                />
                                <MenuItem
                                    icon="settings-outline"
                                    label={t('profile.allSettings', 'All Settings')}
                                    onPress={handleSettingsPress}
                                    isLast
                                />
                            </View>
                        </View>

                        {/* Sign Out */}
                        <Pressable
                            style={styles.signOutButton}
                            onPress={handleSignOut}
                            android_ripple={{ color: theme.colors.error + '20' }}
                        >
                            <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
                            <Typography style={[styles.signOutText, { color: theme.colors.error }]}>
                                {t('profile.signOut', 'Sign Out')}
                            </Typography>
                        </Pressable>
                    </View>
                )

            default:
                return null
        }
    }, [activeTab, myPosts, libraryItems, stats, achievements, unlockedCount, settings, user?.id, router, theme.colors, t, currentLanguageLabel, themeModeLabel, handleSettingsPress, handleSignOut, themeActions, goalsSheetRef, langSheetRef])

    // Loading
    if (loadingProfile) return <ProfileScreenSkeleton />
    if (!user || !fullProfile) return null

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                bounces={false}
            >
                {/* Standard Header */}
                <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                    <Typography style={styles.headerTitle}>{t('tabs.profile', 'Profile')}</Typography>
                    <View style={styles.headerRight}>
                        <CoinDisplay />
                        <Pressable
                            style={styles.settingsButton}
                            onPress={handleSettingsPress}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="settings-outline" size={24} color={theme.colors.text} />
                        </Pressable>
                    </View>
                </View>

                {/* Profile Card */}
                <View style={styles.profileCard}>
                    {/* Avatar Row */}
                    <View style={styles.avatarRow}>
                        <View style={styles.avatarWrapper}>
                            <Image
                                source={fullProfile.photoURL ? { uri: fullProfile.photoURL } : DEFAULT_AVATAR}
                                style={styles.avatar}
                            />
                            <Pressable
                                style={[styles.editAvatarBtn, { backgroundColor: theme.colors.primary }]}
                                onPress={handleEditPress}
                            >
                                <Ionicons name="pencil" size={14} color="#FFFFFF" />
                            </Pressable>
                        </View>

                        {/* Stats Row */}
                        <View style={styles.statsRow}>
                            <ProfileStatItem
                                value={fullProfile.followersCount || 0}
                                label={t('social.followers', 'Followers')}
                                onPress={handleFollowersPress}
                            />
                            <ProfileStatItem
                                value={fullProfile.followingCount || 0}
                                label={t('social.following', 'Following')}
                                onPress={handleFollowersPress}
                            />
                            <ProfileStatItem
                                value={stats.streak}
                                label={t('profile.streak', 'Streak')}
                            />
                        </View>
                    </View>

                    {/* User Info */}
                    <View style={styles.userInfo}>
                        <Typography style={styles.displayName}>
                            {fullProfile.displayName || 'Reader'}
                        </Typography>
                        <Typography style={styles.username}>
                            @{fullProfile.displayName?.toLowerCase().replace(/\s+/g, '_') || 'reader'}
                        </Typography>

                        {/* Bio */}
                        {fullProfile.bio ? (
                            <Typography style={styles.bio}>{fullProfile.bio}</Typography>
                        ) : (
                            <Pressable style={styles.addBioBtn} onPress={handleEditPress}>
                                <Ionicons name="add-circle-outline" size={16} color={theme.colors.primary} />
                                <Typography style={[styles.addBioText, { color: theme.colors.primary }]}>
                                    {t('profile.addBio', 'Add a bio')}
                                </Typography>
                            </Pressable>
                        )}

                        {/* Edit Profile Button */}
                        <Pressable
                            style={[styles.editProfileBtn, { borderColor: theme.colors.border }]}
                            onPress={handleEditPress}
                        >
                            <Ionicons name="create-outline" size={16} color={theme.colors.text} />
                            <Typography style={styles.editProfileText}>
                                {t('profile.editProfile', 'Edit Profile')}
                            </Typography>
                        </Pressable>
                    </View>

                    {/* Guest Banner */}
                    {user?.isAnonymous && showGuestBanner && (
                        <View style={styles.guestBannerWrapper}>
                            <GuestLoginBanner
                                onSignInPress={() => router.push('/login')}
                                onDismiss={() => setShowGuestBanner(false)}
                            />
                        </View>
                    )}
                </View>

                {/* Daily Goal Card */}
                <DailyGoalCard
                    stats={todayStats}
                    onPress={() => goalsSheetRef.current?.expand()}
                />

                {/* Tabs */}
                <View style={styles.tabsContainer}>
                    <ProfileTabButton
                        label={t('profile.tabPosts', 'Posts')}
                        count={stats.postsCount}
                        isActive={activeTab === 'posts'}
                        onPress={() => handleTabChange('posts')}
                    />
                    <ProfileTabButton
                        label={t('profile.tabSaved', 'Saved')}
                        count={libraryItems.length}
                        isActive={activeTab === 'saved'}
                        onPress={() => handleTabChange('saved')}
                    />
                    <ProfileTabButton
                        label={t('profile.tabAbout', 'About')}
                        isActive={activeTab === 'about'}
                        onPress={() => handleTabChange('about')}
                    />
                </View>

                {/* Tab Content */}
                <View style={styles.tabContent}>
                    {renderTabContent()}
                </View>
            </ScrollView>

            {/* Bottom Sheets */}
            <ReadingGoalsSheet
                ref={goalsSheetRef}
                currentGoal={settings.dailyGoalMinutes}
                onSelectGoal={(min) => {
                    settingsActions.updateSettings({ dailyGoalMinutes: min });
                    progressActions.fetchTodayStats();
                }}
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: theme.spacing.xxxxl * 2,
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.xl,
        paddingBottom: theme.spacing.lg,
        backgroundColor: theme.colors.background,
    },
    headerTitle: {
        fontSize: theme.typography.size.xxxl,
        fontWeight: '700',
        color: theme.colors.text,
        letterSpacing: -0.5,
    },
    settingsButton: {
        width: 44,
        height: 44,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.sm,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
    },

    profileCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xxl,
        padding: theme.spacing.xl,
        marginHorizontal: theme.spacing.lg,
        marginTop: theme.spacing.lg,
        ...theme.shadows.md,
    },
    avatarRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    avatarWrapper: {
        position: 'relative',
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        borderWidth: 3,
        borderColor: theme.colors.surface,
    },
    editAvatarBtn: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: theme.colors.surface,
    },
    statsRow: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginLeft: theme.spacing.lg,
        paddingTop: theme.spacing.sm,
    },
    statItem: {
        alignItems: 'center',
    },
    statItemValue: {
        fontSize: theme.typography.size.xl,
        fontWeight: '700',
        color: theme.colors.text,
    },
    statItemLabel: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.textMuted,
        marginTop: theme.spacing.xxs,
    },
    userInfo: {
        marginTop: theme.spacing.lg,
    },
    displayName: {
        fontSize: theme.typography.size.xl,
        fontWeight: '700',
        color: theme.colors.text,
    },
    username: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textMuted,
        marginTop: theme.spacing.xxs,
    },
    bio: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.md,
        lineHeight: 22,
    },
    addBioBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        marginTop: theme.spacing.md,
    },
    addBioText: {
        fontSize: theme.typography.size.md,
        fontWeight: '500',
    },
    editProfileBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        marginTop: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.radius.md,
        borderWidth: 1,
    },
    editProfileText: {
        fontSize: theme.typography.size.md,
        fontWeight: '600',
        color: theme.colors.text,
    },
    guestBannerWrapper: {
        marginTop: theme.spacing.lg,
    },

    // Tabs
    tabsContainer: {
        flexDirection: 'row',
        marginTop: theme.spacing.xl,
        marginHorizontal: theme.spacing.lg,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.md,
        padding: theme.spacing.xs,
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        borderRadius: theme.radius.sm,
        position: 'relative',
    },
    tabButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    tabButtonText: {
        fontSize: theme.typography.size.sm,
        fontWeight: '600',
    },
    tabButtonTextActive: {
        fontWeight: '700',
    },
    tabBadge: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xxs,
        borderRadius: theme.radius.sm,
        minWidth: 20,
        alignItems: 'center',
    },
    tabBadgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
    unlockBanner: {
        backgroundColor: theme.colors.primary,
        borderRadius: theme.radius.xxl,
        padding: theme.spacing.xl,
        marginHorizontal: theme.spacing.lg,
        marginTop: theme.spacing.lg,
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    tabIndicator: {
        position: 'absolute',
        bottom: 2,
        width: 24,
        height: 3,
        borderRadius: theme.radius.xxs,
    },

    // Tab Content
    tabContent: {
        minHeight: 400,
    },
    feedContainer: {
        padding: theme.spacing.lg,
        gap: theme.spacing.lg,
    },
    savedGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: theme.spacing.lg,
        gap: theme.spacing.md,
    },

    // About Tab
    aboutContainer: {
        padding: theme.spacing.lg,
    },
    quickStatsCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xxl,
        padding: theme.spacing.xl,
        marginBottom: theme.spacing.xl,
        ...theme.shadows.md,
    },
    quickStatsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.md,
    },
    quickStatItem: {
        flex: 1,
        minWidth: '40%',
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
    },
    quickStatIcon: {
        width: 40,
        height: 40,
        borderRadius: theme.radius.full,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.sm,
    },
    quickStatValue: {
        fontSize: theme.typography.size.xl,
        fontWeight: '800',
        color: theme.colors.text,
    },
    quickStatLabel: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.textMuted,
        fontWeight: '600',
        marginTop: 2,
    },
    menuSection: {
        marginBottom: theme.spacing.xl,
    },
    menuSectionTitle: {
        fontSize: theme.typography.size.xs,
        fontWeight: '700',
        color: theme.colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: theme.spacing.md,
        marginLeft: theme.spacing.xs,
    },
    menuCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.md,
        overflow: 'hidden',
        ...theme.shadows.sm,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.lg,
    },
    menuItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.lg,
    },
    menuIconWrapper: {
        width: 36,
        height: 36,
        borderRadius: theme.radius.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuItemRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
    },
    menuItemLabel: {
        fontSize: theme.typography.size.md,
        color: theme.colors.text,
        fontWeight: '500',
    },
    menuItemValue: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textMuted,
    },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        paddingVertical: theme.spacing.lg,
        marginTop: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.md,
    },
    signOutText: {
        fontSize: theme.typography.size.md,
        fontWeight: '600',
    },
}));

