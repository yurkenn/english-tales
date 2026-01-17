import { View, Pressable, ScrollView, Image, StyleSheet } from 'react-native';
import { useTheme, Theme } from '@/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Typography, ProfileTabButton, ProfileStatItem } from '@/components/atoms';
import { GuestLoginBanner, DailyGoalCard } from '@/components/molecules';
import { ProfilePostsTab, ProfileSavedTab, ProfileAboutTab, ProfileSheets } from '@/components/molecules/profile';
import { ProfileScreenSkeleton } from '@/components/skeletons/ProfileScreenSkeleton';

import { useLibraryStore } from '@/store/libraryStore';
import { useProgressStore } from '@/store/progressStore';
import { useProfileDataManager, useProfileStatsManager, useProfileUIController, useResponsiveLayout } from '@/hooks';

const DEFAULT_AVATAR = require('@/assets/defaultavatar.png');

export default function ProfileScreen() {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const insets = useSafeAreaInsets();
    const { containerPadding } = useResponsiveLayout();

    // Stores
    const { items: libraryItems } = useLibraryStore();
    const { todayStats } = useProgressStore();

    // Hooks
    const { user, fullProfile, myPosts, loadingProfile } = useProfileDataManager();
    const {
        stats,
        achievements,
        unlockedCount,
        themeModeLabel,
        currentLanguageLabel,
        settings,
    } = useProfileStatsManager(user, myPosts);

    const {
        activeTab,
        showGuestBanner,
        setShowGuestBanner,
        goalsSheetRef,
        langSheetRef,
        isGoalsSheetOpen,
        isLangSheetOpen,
        openGoalsSheet,
        closeGoalsSheet,
        openLangSheet,
        closeLangSheet,
        handleSettingsPress,
        handleEditPress,
        handleTabChange,
        handleSignOut,
        handleFollowersPress,
        themeActions,
        settingsActions,
        progressActions,
        router,
    } = useProfileUIController();

    // Loading state
    if (loadingProfile) return <ProfileScreenSkeleton />;
    if (!user || !fullProfile) return null;

    // Tab content mapping
    const renderTabContent = () => {
        switch (activeTab) {
            case 'posts':
                return <ProfilePostsTab posts={myPosts} currentUserId={user?.id} />;
            case 'saved':
                return <ProfileSavedTab libraryItems={libraryItems} />;
            case 'about':
                return (
                    <ProfileAboutTab
                        stats={stats}
                        achievements={achievements}
                        unlockedCount={unlockedCount}
                        settings={settings}
                        themeModeLabel={themeModeLabel}
                        currentLanguageLabel={currentLanguageLabel}
                        onGoalsPress={openGoalsSheet}
                        onLanguagePress={openLangSheet}
                        onThemeToggle={themeActions.toggleTheme}
                        onSignOut={handleSignOut}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                bounces={false}
            >
                {/* Header */}
                <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                    <Typography style={styles.headerTitle}>{t('tabs.profile', 'Profile')}</Typography>
                    <Pressable
                        style={styles.settingsButton}
                        onPress={handleSettingsPress}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="settings-outline" size={24} color={theme.colors.text} />
                    </Pressable>
                </View>

                {/* Profile Card */}
                <View style={styles.profileCard}>
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
                                <Ionicons name="pencil" size={14} color={theme.colors.textInverse} />
                            </Pressable>
                        </View>

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

                    <View style={styles.userInfo}>
                        <Typography style={styles.displayName}>
                            {fullProfile.displayName || 'Reader'}
                        </Typography>
                        <Typography style={styles.username}>
                            @{fullProfile.displayName?.toLowerCase().replace(/\s+/g, '_') || 'reader'}
                        </Typography>

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
                <DailyGoalCard stats={todayStats} onPress={openGoalsSheet} />

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
            <ProfileSheets
                isGoalsOpen={isGoalsSheetOpen}
                goalsRef={goalsSheetRef}
                currentGoal={settings.dailyGoalMinutes}
                onSelectGoal={(min) => {
                    settingsActions.updateSettings({ dailyGoalMinutes: min });
                    progressActions.fetchTodayStats();
                }}
                onCloseGoals={closeGoalsSheet}
                isLangOpen={isLangSheetOpen}
                langRef={langSheetRef}
                currentLanguage={settings.language}
                onSelectLanguage={(code) => settingsActions.updateSettings({ language: code as any })}
                onCloseLang={closeLangSheet}
            />
        </View>
    );
}

function createStyles(theme: Theme) {
    return StyleSheet.create({
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
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: theme.spacing.lg,
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
            justifyContent: 'space-evenly',
            alignItems: 'center',
            marginLeft: theme.spacing.md,
            paddingTop: theme.spacing.sm,
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
        tabsContainer: {
            flexDirection: 'row',
            marginTop: theme.spacing.xl,
            marginHorizontal: theme.spacing.lg,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.md,
            padding: theme.spacing.xs,
        },
        tabContent: {
            minHeight: 400,
        },
    });
}
