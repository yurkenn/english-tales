import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import {
    ProfileCard,
    StatsGrid,
    ProfileMenu,
    ReadingGoalsSheet,
    ProfileScreenSkeleton,
    ReadingCalendar,
} from '@/components';
import type { MenuItem } from '@/components';
import { useAuthStore } from '@/store/authStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useProgressStore } from '@/store/progressStore';
import { useThemeStore } from '@/store/themeStore';
import { useAchievementsStore } from '@/store/achievementsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useToastStore } from '@/store/toastStore';
import { haptics } from '@/utils/haptics';

export default function ProfileScreen() {
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user, signOut, isLoading, updateProfile } = useAuthStore();
    const { items: libraryItems } = useLibraryStore();
    const { progressMap, actions: progressActions } = useProgressStore();

    // Bottom sheet refs
    const goalsSheetRef = useRef<BottomSheet>(null);

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

    const stats = [
        { label: 'Books Read', value: computedStats.booksRead, icon: 'book' as const },
        { label: 'Day Streak', value: computedStats.readingStreak, icon: 'flame' as const },
    ];

    // Theme
    const { mode: themeMode, actions: themeActions } = useThemeStore();
    const themeModeLabel = themeMode === 'system' ? 'System' : themeMode === 'light' ? 'Light' : 'Dark';

    // Achievements
    const { actions: achievementActions } = useAchievementsStore();
    const achievements = achievementActions.getAll();
    const unlockedCount = achievements.filter(a => a.unlocked).length;

    // Settings
    const { settings, actions: settingsActions } = useSettingsStore();
    const toastActions = useToastStore((state) => state.actions);

    useEffect(() => {
        settingsActions.loadSettings();
    }, []);

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
        toastActions.success(`Notifications ${!settings.notificationsEnabled ? 'enabled' : 'disabled'}`);
    };

    const handleHelp = () => {
        haptics.selection();
        toastActions.info('Need help? Contact us at support@englishtales.app');
    };

    const handleAbout = () => {
        haptics.selection();
        toastActions.info('English Tales v1.0.0\n\nImprove your English through beautiful stories.\n\n© 2024 English Tales');
    };

    const menuItems: MenuItem[] = [
        { label: 'Reading Goals', icon: 'flag-outline', value: `${settings.dailyGoalMinutes} min/day`, onPress: handleOpenGoals },
        { label: 'Achievements', icon: 'trophy-outline', value: `${unlockedCount}/${achievements.length}`, onPress: handleAchievements },
        { label: 'Notifications', icon: 'notifications-outline', value: settings.notificationsEnabled ? 'On' : 'Off', onPress: handleNotifications },
        { label: 'Appearance', icon: 'color-palette-outline', value: themeModeLabel, onPress: themeActions.toggleTheme },
        { label: 'Help & Support', icon: 'help-circle-outline', onPress: handleHelp },
        { label: 'About', icon: 'information-circle-outline', onPress: handleAbout },
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
                    <Text style={styles.title}>Profile</Text>
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
                    isAnonymous={user.isAnonymous}
                    onSignInPress={signOut}
                />

                {/* Stats Grid */}
                <StatsGrid stats={stats} />

                {/* Reading Calendar */}
                {useMemo(() => {
                    // Prepare reading data for calendar
                    const readingData: Record<string, number> = {};
                    Object.values(progressMap).forEach((progress) => {
                        if (progress.lastReadAt) {
                            const dateStr = new Date(progress.lastReadAt).toISOString().split('T')[0];
                            // Use 1 to indicate activity (can be enhanced with actual minutes later)
                            readingData[dateStr] = (readingData[dateStr] || 0) + 1;
                        }
                    });
                    return <ReadingCalendar readingData={readingData} />;
                }, [progressMap])}

                {/* Menu */}
                <ProfileMenu items={menuItems} />

                {/* Sign Out */}
                <Pressable style={styles.signOutButton} onPress={signOut}>
                    <Ionicons name="log-out-outline" size={22} color={theme.colors.error} />
                    <Text style={styles.signOutText}>Sign Out</Text>
                </Pressable>
            </ScrollView>

            {/* Reading Goals Bottom Sheet */}
            <ReadingGoalsSheet
                ref={goalsSheetRef}
                currentGoal={settings.dailyGoalMinutes}
                onSelectGoal={(minutes) => settingsActions.updateSettings({ dailyGoalMinutes: minutes })}
                onClose={handleCloseGoals}
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
