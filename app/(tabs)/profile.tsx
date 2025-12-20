import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, ScrollView, Pressable, ActivityIndicator, Linking, Dimensions } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import Animated, {
    useSharedValue,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    interpolate,
    Extrapolation,
    FadeInDown
} from 'react-native-reanimated';

import { Typography } from '../../components/atoms';
import { ProfileHeader } from '../../components/organisms/ProfileHeader';
import { ProfileTabs, ProfileTabType } from '../../components/molecules/ProfileTabs';
import { ReadingGoalsSheet } from '../../components/organisms/ReadingGoalsSheet';
import { ReadingCalendar } from '../../components/organisms/ReadingCalendar';
import { InsightsCard } from '../../components/organisms/InsightsCard';
import { WordGrowthChart } from '../../components/organisms/WordGrowthChart';
import { ProfileMenu, MenuItem } from '../../components/organisms/ProfileMenu';
import { CommunityPostCard } from '../../components/organisms/CommunityPostCard';
import { StoryGridCard } from '../../components/molecules/StoryGridCard';
import { ActionSheet } from '../../components/molecules/ActionSheet';

import { useAuthStore } from '@/store/authStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useProgressStore } from '@/store/progressStore';
import { useThemeStore } from '@/store/themeStore';
import { useAchievementsStore } from '@/store/achievementsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useToastStore } from '@/store/toastStore';
import { useVocabularyStore } from '@/store/vocabularyStore';
import { userService } from '@/services/userService';
import { communityService } from '@/services/communityService';
import { UserProfile, CommunityPost } from '@/types';
import { haptics } from '@/utils/haptics';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Illustrations
const NO_POSTS_ILLUSTRATION = require('@/assets/illustrations/no_posts.png');
const EMPTY_LIBRARY_ILLUSTRATION = require('@/assets/illustrations/empty_library.png');

export default function ProfileScreen() {
    const { t } = useTranslation();
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // Stores
    const { user, signOut, isLoading: authLoading } = useAuthStore();
    const { items: libraryItems } = useLibraryStore();
    const { progressMap, totalReadingTimeMs, actions: progressActions } = useProgressStore();
    const { savedWords } = useVocabularyStore();
    const { settings, actions: settingsActions } = useSettingsStore();
    const { mode: themeMode, actions: themeActions } = useThemeStore();
    const { actions: achievementActions } = useAchievementsStore();
    const toast = useToastStore();

    // State
    const [activeTab, setActiveTab] = useState<ProfileTabType>('posts');
    const [fullProfile, setFullProfile] = useState<UserProfile | null>(null);
    const [myPosts, setMyPosts] = useState<CommunityPost[]>([]);
    const [loadingProfile, setLoadingProfile] = useState(true);

    // Animation Refs
    const scrollY = useSharedValue(0);
    const scrollHandler = useAnimatedScrollHandler((event) => {
        scrollY.value = event.contentOffset.y;
    });

    // Refs
    const goalsSheetRef = useRef<BottomSheet>(null);
    const langSheetRef = useRef<BottomSheet>(null);

    // Initial load
    useEffect(() => {
        const loadInitialData = async () => {
            if (!user) return;
            setLoadingProfile(true);

            const [profileRes, postsRes] = await Promise.all([
                userService.getUserProfile(user.id),
                communityService.getPostsByUser(user.id)
            ]);

            if (profileRes.success) setFullProfile(profileRes.data);
            if (postsRes.success) setMyPosts(postsRes.data);

            setLoadingProfile(false);
        };
        loadInitialData();
        settingsActions.loadSettings();
    }, [user]);

    // Sticky Header Style
    const stickyHeaderStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            scrollY.value,
            [150, 250],
            [0, 1],
            Extrapolation.CLAMP
        );
        return { opacity };
    });

    const settingsButtonStyle = useAnimatedStyle(() => {
        const backgroundColor = scrollY.value > 150
            ? 'transparent'
            : 'rgba(0,0,0,0.3)';
        return { backgroundColor };
    });

    // Compute Stats
    const stats = useMemo(() => {
        let booksRead = 0;
        Object.values(progressMap).forEach(p => { if (p.isCompleted) booksRead++; });

        return {
            booksRead,
            streak: progressActions.getStreak(),
            postsCount: myPosts.length,
            vocabCount: Object.keys(savedWords).length
        };
    }, [progressMap, myPosts, savedWords]);

    // Menu logic
    const achievements = achievementActions.getAll();
    const unlockedCount = achievements.filter(a => a.unlocked).length;
    const themeModeLabel = themeMode === 'system' ? t('appearance.system') : themeMode === 'light' ? t('appearance.light') : t('appearance.dark');

    const LANGUAGES = [
        { code: 'en', label: 'English' },
        { code: 'tr', label: 'Türkçe' },
        { code: 'es', label: 'Español' },
        { code: 'de', label: 'Deutsch' },
        { code: 'fr', label: 'Français' },
    ];
    const currentLanguageLabel = LANGUAGES.find(l => l.code === (settings.language || 'en'))?.label || 'English';

    const menuItems: MenuItem[] = [
        { label: t('profile.readingGoals'), icon: 'flag-outline', value: `${settings.dailyGoalMinutes} min/day`, onPress: () => { haptics.selection(); goalsSheetRef.current?.expand(); } },
        { label: t('profile.achievements'), icon: 'trophy-outline', value: `${unlockedCount}/${achievements.length}`, onPress: () => { haptics.selection(); router.push('/achievements'); } },
        { label: t('social.following', 'Following'), icon: 'people-outline', onPress: () => { haptics.selection(); router.push('/social' as any); } },
        { label: t('profile.vocabulary', 'Vocabulary'), icon: 'bookmark-outline', value: `${stats.vocabCount} words`, onPress: () => { haptics.selection(); router.push('/user/vocabulary'); } },
        { label: t('profile.language'), icon: 'language-outline', value: currentLanguageLabel, onPress: () => { haptics.selection(); langSheetRef.current?.expand(); } },
        { label: t('profile.appearance'), icon: 'color-palette-outline', value: themeModeLabel, onPress: themeActions.toggleTheme },
    ];

    const handleSocialPress = (type: string, url: string) => {
        haptics.light();
        Linking.openURL(url).catch(() => toast.actions.error('Could not open link'));
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'posts':
                return (
                    <Animated.View entering={FadeInDown.duration(400)} style={styles.tabContent}>
                        {myPosts.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="chatbubble-ellipses-outline" size={64} color={theme.colors.border} />
                                <Typography color={theme.colors.textMuted} style={styles.emptyText}>
                                    No posts yet. Share something with the community!
                                </Typography>
                            </View>
                        ) : (
                            myPosts.map((post, index) => (
                                <Animated.View key={post.id} entering={FadeInDown.delay(index * 100).duration(400)}>
                                    <CommunityPostCard
                                        post={post}
                                        currentUserId={user?.id}
                                        onLike={() => { }}
                                        onReply={() => { }}
                                    />
                                </Animated.View>
                            ))
                        )}
                    </Animated.View>
                );
            case 'reviews':
                return (
                    <Animated.View entering={FadeInDown.duration(400)} style={styles.tabContent}>
                        <View style={styles.emptyContainer}>
                            <Ionicons name="star-outline" size={64} color={theme.colors.border} />
                            <Typography color={theme.colors.textMuted} style={styles.emptyText}>
                                No reviews written yet. Rate some stories to see them here!
                            </Typography>
                        </View>
                    </Animated.View>
                );
            case 'library':
                return (
                    <Animated.View entering={FadeInDown.duration(400)} style={styles.tabContent}>
                        {libraryItems.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="library-outline" size={64} color={theme.colors.border} />
                                <Typography color={theme.colors.textMuted} style={styles.emptyText}>
                                    Your library is empty. Save stories to read them later!
                                </Typography>
                            </View>
                        ) : (
                            <View style={styles.grid}>
                                {libraryItems.map((item, index) => (
                                    <Animated.View key={item.storyId} entering={FadeInDown.delay(index * 50).duration(400)}>
                                        <StoryGridCard
                                            story={item.story}
                                            isInLibrary={true}
                                            onPress={() => router.push(`/story/${item.storyId}`)}
                                        />
                                    </Animated.View>
                                ))}
                            </View>
                        )}
                    </Animated.View>
                );
            case 'more':
                return (
                    <Animated.View entering={FadeInDown.duration(400)} style={styles.tabContent}>
                        <View style={styles.sectionHeader}>
                            <Typography variant="h3">{t('profile.learningInsights', 'Learning Insights')}</Typography>
                        </View>
                        <InsightsCard
                            wordsLearned={stats.vocabCount}
                            averageAccuracy={0}
                            totalReadingTimeMs={totalReadingTimeMs}
                        />
                        <View style={{ marginVertical: 12 }}>
                            <ReadingCalendar readingData={{}} />
                        </View>
                        <WordGrowthChart words={Object.values(savedWords)} />

                        <View style={styles.sectionDivider} />
                        <View style={styles.sectionHeader}>
                            <Typography variant="h3">{t('settings.title', 'Settings')}</Typography>
                        </View>
                        <ProfileMenu items={menuItems} />

                        <Pressable style={styles.signOutButton} onPress={signOut}>
                            <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
                            <Typography variant="bodyBold" color={theme.colors.error}>Sign Out</Typography>
                        </Pressable>
                    </Animated.View>
                );
            default:
                return null;
        }
    };

    if (authLoading || loadingProfile) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!user || !fullProfile) return null;

    return (
        <View style={styles.container}>
            <Animated.View style={[
                styles.stickyHeader,
                { paddingTop: Math.max(insets.top, 16) },
                stickyHeaderStyle
            ]}>
                <Typography variant="bodyBold" style={styles.stickyTitle}>
                    {fullProfile.displayName}
                </Typography>
            </Animated.View>

            <View style={[styles.navBar, { paddingTop: Math.max(insets.top, 16) }]}>
                <View style={styles.navBarFill} />
                <Animated.View style={[styles.settingsButtonWrapper, settingsButtonStyle]}>
                    <Pressable
                        style={styles.navAction}
                        onPress={() => { haptics.selection(); router.push('/settings'); }}
                    >
                        <Ionicons name="settings-outline" size={24} color={scrollY.value > 150 ? theme.colors.text : "#FFF"} />
                    </Pressable>
                </Animated.View>
            </View>

            <Animated.ScrollView
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
                stickyHeaderIndices={[1]}
            >
                <ProfileHeader
                    profile={{
                        ...fullProfile,
                        followersCount: fullProfile.followersCount || 0,
                        followingCount: fullProfile.followingCount || 0,
                        streak: stats.streak
                    }}
                    isSelf={true}
                    onEditPress={() => router.push('/user/edit')}
                    scrollY={scrollY}
                />

                <View style={{ backgroundColor: theme.colors.background }}>
                    <ProfileTabs
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        counts={{
                            posts: stats.postsCount,
                            library: libraryItems.length
                        }}
                    />
                </View>

                {renderTabContent()}
            </Animated.ScrollView>

            <ReadingGoalsSheet
                ref={goalsSheetRef}
                currentGoal={settings.dailyGoalMinutes}
                onSelectGoal={(min) => settingsActions.updateSettings({ dailyGoalMinutes: min })}
                onClose={() => goalsSheetRef.current?.close()}
            />

            <ActionSheet
                ref={langSheetRef}
                title={t('settings.preferences.language')}
                options={LANGUAGES.map(lang => ({
                    label: lang.label,
                    icon: (settings.language === lang.code) ? 'checkmark-circle' : 'ellipse-outline',
                    onPress: () => {
                        haptics.success();
                        settingsActions.updateSettings({ language: lang.code as any });
                    }
                }))}
                onClose={() => langSheetRef.current?.close()}
            />
        </View>
    );
}

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    navBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        paddingHorizontal: theme.spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        height: 100,
    },
    navBarFill: {
        flex: 1,
    },
    settingsButtonWrapper: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    navAction: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stickyHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 15,
        height: 100,
        backgroundColor: theme.colors.background,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.sm,
    },
    stickyTitle: {
        fontSize: 17,
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
    emptyIllustration: {
        width: 240,
        height: 240,
        resizeMode: 'contain',
        marginBottom: 20,
    },
    emptyText: {
        textAlign: 'center',
        fontSize: 16,
        lineHeight: 24,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: theme.spacing.lg,
        gap: 16,
        paddingTop: 8,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
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
}));
