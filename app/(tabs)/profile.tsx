import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import { ProfileCard } from '../../components/organisms/ProfileCard';
import { StatsGrid } from '../../components/organisms/StatsGrid';
import { ProfileMenu, MenuItem } from '../../components/organisms/ProfileMenu';
import { ReadingGoalsSheet } from '../../components/organisms/ReadingGoalsSheet';
import { ReadingCalendar } from '../../components/organisms/ReadingCalendar';
import { ActionSheet } from '../../components/molecules/ActionSheet';
import { InsightsCard } from '../../components/organisms/InsightsCard';
import { WordGrowthChart } from '../../components/organisms/WordGrowthChart';
import { ProfileScreenSkeleton } from '../../components/skeletons';
import { FriendCircle } from '../../components/molecules/FriendCircle';
import { useAuthStore } from '@/store/authStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useProgressStore } from '@/store/progressStore';
import { useThemeStore } from '@/store/themeStore';
import { useAchievementsStore } from '@/store/achievementsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useToastStore } from '@/store/toastStore';
import { useVocabularyStore } from '@/store/vocabularyStore';
import { socialService } from '@/services/socialService';
import { userService } from '@/services/userService';
import { UserProfile } from '@/types';
import { haptics } from '@/utils/haptics';

import { useTranslation } from 'react-i18next';

export default function ProfileScreen() {
    const { t } = useTranslation();
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user, signOut, isLoading, updateProfile } = useAuthStore();
    const { items: libraryItems } = useLibraryStore();
    const { progressMap, totalReadingTimeMs, actions: progressActions } = useProgressStore();
    const { savedWords } = useVocabularyStore();

    // Bottom sheet refs
    const goalsSheetRef = useRef<BottomSheet>(null);
    const langSheetRef = useRef<BottomSheet>(null);

    // Compute real stats from progress data
    const computedStats = useMemo(() => {
        let booksRead = 0;

        Object.values(progressMap).forEach((progress) => {
            if (progress.isCompleted) {
                booksRead++;
            }
        });

        return {
            booksRead,
            readingStreak: progressActions.getStreak(),
        };
    }, [progressMap, progressActions]);

    const [friends, setFriends] = useState<UserProfile[]>([]);
    const [isLoadingFriends, setIsLoadingFriends] = useState(true);
    const [fullProfile, setFullProfile] = useState<UserProfile | null>(null);

    // Fetch user profile data from Firestore
    useEffect(() => {
        const fetchFullProfile = async () => {
            if (!user) return;
            const res = await userService.getUserProfile(user.id);
            if (res.success) {
                setFullProfile(res.data);
            }
        };
        fetchFullProfile();
    }, [user]);

    // Calculate Learning Insights
    const learningInsights = useMemo(() => {
        const words = Object.values(savedWords);
        const quizResults = Object.values(progressMap).filter(p => p.quizScore !== undefined);

        let avgAccuracy = 0;
        if (quizResults.length > 0) {
            const totalAccuracy = quizResults.reduce((acc, p) => {
                const accuracy = p.quizTotal ? (p.quizScore || 0) / p.quizTotal : 0;
                return acc + accuracy;
            }, 0);
            avgAccuracy = Math.round((totalAccuracy / quizResults.length) * 100);
        }

        return {
            wordsLearned: words.length,
            averageAccuracy: avgAccuracy,
            totalReadingTimeMs,
            words,
        };
    }, [savedWords, progressMap, totalReadingTimeMs]);

    const stats = [
        { label: t('profile.booksRead', 'Books Read'), value: computedStats.booksRead, icon: 'book' as const },
        { label: t('profile.dayStreak', 'Day Streak'), value: computedStats.readingStreak, icon: 'flame' as const },
    ];

    // Prepare reading data for calendar
    const readingData = useMemo(() => {
        const data: Record<string, number> = {};
        Object.values(progressMap).forEach((progress) => {
            if (progress.lastReadAt) {
                const dateStr = new Date(progress.lastReadAt).toISOString().split('T')[0];
                data[dateStr] = (data[dateStr] || 0) + 1;
            }
        });
        return data;
    }, [progressMap]);

    // Theme
    const { mode: themeMode, actions: themeActions } = useThemeStore();
    const themeModeLabel = themeMode === 'system' ? t('appearance.system', 'System') : themeMode === 'light' ? t('appearance.light', 'Light') : t('appearance.dark', 'Dark');

    // Achievements
    const { actions: achievementActions } = useAchievementsStore();
    const achievements = achievementActions.getAll();
    const unlockedCount = achievements.filter(a => a.unlocked).length;

    // Settings
    const { settings, actions: settingsActions } = useSettingsStore();
    const toastActions = useToastStore((state) => state.actions);

    const LANGUAGES = [
        { code: 'en', label: 'English' },
        { code: 'tr', label: 'Türkçe' },
        { code: 'es', label: 'Español' },
        { code: 'de', label: 'Deutsch' },
        { code: 'fr', label: 'Français' },
    ];

    const currentLanguageLabel = LANGUAGES.find(l => l.code === (settings.language || 'en'))?.label || 'English';

    useEffect(() => {
        settingsActions.loadSettings();
    }, []);

    useEffect(() => {
        const fetchFollowing = async () => {
            if (!user) return;
            setIsLoadingFriends(true);
            const res = await socialService.getFollowingIds(user.id);
            if (res.success) {
                const profiles: UserProfile[] = [];
                for (const id of res.data.slice(0, 5)) { // Show only a few on profile preview
                    const profileRes = await userService.getUserProfile(id);
                    if (profileRes.success) {
                        profiles.push(profileRes.data);
                    }
                }
                setFriends(profiles);
            }
            setIsLoadingFriends(false);
        };
        fetchFollowing();
    }, [user]);

    // Handlers
    const handleOpenGoals = useCallback(() => {
        haptics.selection();
        goalsSheetRef.current?.expand();
    }, []);

    const handleCloseGoals = useCallback(() => {
        goalsSheetRef.current?.close();
    }, []);

    const handleAchievements = () => {
        haptics.selection();
        router.push('/achievements');
    };

    const handleNotifications = async () => {
        haptics.selection();
        await settingsActions.updateSettings({ notificationsEnabled: !settings.notificationsEnabled });
        toastActions.success(t('notifications.feedback', { status: !settings.notificationsEnabled ? t('common.on') : t('common.off') }));
    };

    const handleHelp = () => {
        haptics.selection();
        toastActions.info(t('profile.helpMessage', 'Need help? Contact us at support@englishtales.app'));
    };

    const handleAbout = () => {
        haptics.selection();
        toastActions.info(t('profile.aboutMessage', 'English Tales v1.0.0\n\nImprove your English through beautiful stories.\n\n© 2024 English Tales'));
    };

    const handleLanguage = () => {
        haptics.selection();
        langSheetRef.current?.expand();
    };

    const menuItems: MenuItem[] = [
        { label: t('profile.readingGoals'), icon: 'flag-outline', value: `${settings.dailyGoalMinutes} min/day`, onPress: handleOpenGoals },
        { label: t('profile.achievements'), icon: 'trophy-outline', value: `${unlockedCount}/${achievements.length}`, onPress: handleAchievements },
        { label: t('social.following', 'Following'), icon: 'people-outline', onPress: () => { haptics.selection(); router.push('/social' as any); } },
        { label: t('profile.vocabulary', 'Vocabulary'), icon: 'bookmark-outline', value: `${learningInsights.wordsLearned} words`, onPress: () => { haptics.selection(); router.push('/user/vocabulary'); } },
        { label: t('profile.language'), icon: 'language-outline', value: currentLanguageLabel, onPress: handleLanguage },
        { label: t('profile.notifications'), icon: 'notifications-outline', value: settings.notificationsEnabled ? t('common.on') : t('common.off'), onPress: handleNotifications },
        { label: t('profile.appearance'), icon: 'color-palette-outline', value: themeModeLabel, onPress: themeActions.toggleTheme },
        { label: t('profile.help'), icon: 'help-circle-outline', onPress: handleHelp },
        { label: t('profile.about'), icon: 'information-circle-outline', onPress: handleAbout },
    ];

    if (isLoading) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <ProfileScreenSkeleton />
            </View>
        );
    }

    if (!user) return null;

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>{t('profile.title')}</Text>
                    <Pressable
                        style={styles.settingsButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        onPress={() => { haptics.selection(); router.push('/settings'); }}
                    >
                        <Ionicons name="settings-outline" size={theme.iconSize.md} color={theme.colors.text} />
                    </Pressable>
                </View>

                {/* Profile Card */}
                <ProfileCard
                    photoURL={user.photoURL}
                    displayName={user.displayName}
                    email={user.email}
                    bio={fullProfile?.bio}
                    socialLinks={fullProfile?.socialLinks}
                    isAnonymous={user.isAnonymous}
                    onSignInPress={signOut}
                    onEditPress={() => { haptics.selection(); router.push('/user/edit'); }}
                />

                <FriendCircle
                    friends={friends}
                    onPressAll={() => router.push('/social' as any)}
                />

                {/* Stats Grid */}
                <StatsGrid stats={stats} />

                {/* Learning Insights */}
                {learningInsights && (
                    <InsightsCard
                        wordsLearned={learningInsights.wordsLearned}
                        averageAccuracy={learningInsights.averageAccuracy}
                        totalReadingTimeMs={learningInsights.totalReadingTimeMs}
                    />
                )}

                <WordGrowthChart words={learningInsights.words} />

                {/* Reading Calendar */}
                <ReadingCalendar readingData={readingData} />

                {/* Menu */}
                <ProfileMenu items={menuItems} />

                {/* Sign Out */}
                <Pressable style={styles.signOutButton} onPress={signOut}>
                    <Ionicons name="log-out-outline" size={22} color={theme.colors.error} />
                    <Text style={styles.signOutText}>{t('profile.signOut')}</Text>
                </Pressable>
            </ScrollView>

            {/* Reading Goals Bottom Sheet */}
            <ReadingGoalsSheet
                ref={goalsSheetRef}
                currentGoal={settings.dailyGoalMinutes}
                onSelectGoal={(minutes) => settingsActions.updateSettings({ dailyGoalMinutes: minutes })}
                onClose={handleCloseGoals}
            />

            {/* Language Selection Sheet */}
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
    content: {
        paddingBottom: theme.spacing.xxxl,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.lg,
    },
    title: {
        fontSize: theme.typography.size.xxxl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
        letterSpacing: -0.5,
    },
    settingsButton: {
        width: theme.avatarSize.md,
        height: theme.avatarSize.md,
        borderRadius: theme.radius.full,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surfaceElevated,
    },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        marginHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.lg,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xl,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    signOutText: {
        fontSize: theme.typography.size.lg,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.error,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
    },
}));
