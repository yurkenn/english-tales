import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
    ProfileCard,
    StatsGrid,
    ProfileMenu,
    ReadingGoalsModal,
} from '@/components';
import type { MenuItem } from '@/components';
import { useAuthStore } from '@/store/authStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useProgressStore } from '@/store/progressStore';
import { useThemeStore } from '@/store/themeStore';
import { useAchievementsStore } from '@/store/achievementsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { haptics } from '@/utils/haptics';

export default function ProfileScreen() {
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user, signOut, isLoading, updateProfile } = useAuthStore();
    const { items: libraryItems } = useLibraryStore();
    const { progressMap, actions: progressActions } = useProgressStore();

    // Compute real stats from progress data
    const computedStats = useMemo(() => {
        let booksRead = 0;
        let totalWords = 0;
        let totalMinutes = 0;

        Object.values(progressMap).forEach((progress) => {
            if (progress.isCompleted) {
                booksRead++;
                const libraryItem = libraryItems.find((item) => item.storyId === progress.storyId);
                if (libraryItem?.story) {
                    totalWords += libraryItem.story.wordCount || 0;
                    totalMinutes += libraryItem.story.estimatedReadTime || 0;
                }
            }
        });

        const pagesRead = Math.ceil(totalWords / 250);

        return {
            booksRead,
            pagesRead,
            minutesRead: totalMinutes,
            readingStreak: progressActions.getStreak(),
        };
    }, [progressMap, libraryItems, progressActions]);

    const stats = [
        { label: 'Books Read', value: computedStats.booksRead, icon: 'book' as const },
        { label: 'Pages Read', value: computedStats.pagesRead.toLocaleString(), icon: 'document-text' as const },
        { label: 'Day Streak', value: computedStats.readingStreak, icon: 'flame' as const },
        { label: 'Minutes', value: computedStats.minutesRead.toLocaleString(), icon: 'time' as const },
    ];

    // Theme
    const { mode: themeMode, actions: themeActions } = useThemeStore();
    const themeModeLabel = themeMode === 'system' ? 'System' : themeMode === 'light' ? 'Light' : 'Dark';

    // Achievements
    const { actions: achievementActions } = useAchievementsStore();
    const achievements = achievementActions.getAll();
    const unlockedCount = achievements.filter(a => a.unlocked).length;

    // Modal states
    const [showGoalsModal, setShowGoalsModal] = useState(false);
    const { settings, actions: settingsActions } = useSettingsStore();

    useEffect(() => {
        settingsActions.loadSettings();
    }, []);

    // Menu handlers
    const handleAchievements = () => {
        haptics.selection();
        Alert.alert(
            '🏆 Achievements',
            `You've unlocked ${unlockedCount}/${achievements.length} achievements!\n\n${achievements.map(a => `${a.unlocked ? '✅' : '🔒'} ${a.icon} ${a.title}`).join('\n')}`,
            [{ text: 'OK' }]
        );
    };

    const handleNotifications = async () => {
        haptics.selection();
        await settingsActions.updateSettings({ notificationsEnabled: !settings.notificationsEnabled });
    };

    const handleHelp = () => {
        haptics.selection();
        Alert.alert('Help & Support', 'Need help? Contact us at support@englishtales.app', [{ text: 'OK' }]);
    };

    const handleAbout = () => {
        haptics.selection();
        Alert.alert('About English Tales', 'Version 1.0.0\n\nImprove your English through beautiful stories.\n\n© 2024 English Tales', [{ text: 'OK' }]);
    };

    const menuItems: MenuItem[] = [
        { label: 'Reading Goals', icon: 'flag-outline', value: `${settings.dailyGoalMinutes} min/day`, onPress: () => { haptics.selection(); setShowGoalsModal(true); } },
        { label: 'Achievements', icon: 'trophy-outline', value: `${unlockedCount}/${achievements.length}`, onPress: handleAchievements },
        { label: 'Notifications', icon: 'notifications-outline', value: settings.notificationsEnabled ? 'On' : 'Off', onPress: handleNotifications },
        { label: 'Appearance', icon: 'color-palette-outline', value: themeModeLabel, onPress: themeActions.toggleTheme },
        { label: 'Help & Support', icon: 'help-circle-outline', onPress: handleHelp },
        { label: 'About', icon: 'information-circle-outline', onPress: handleAbout },
    ];

    if (isLoading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
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

                {/* Menu */}
                <ProfileMenu items={menuItems} />

                {/* Sign Out */}
                <Pressable style={styles.signOutButton} onPress={signOut}>
                    <Ionicons name="log-out-outline" size={22} color={theme.colors.error} />
                    <Text style={styles.signOutText}>Sign Out</Text>
                </Pressable>
            </ScrollView>

            {/* Modals */}
            <ReadingGoalsModal
                visible={showGoalsModal}
                onClose={() => setShowGoalsModal(false)}
                currentGoal={settings.dailyGoalMinutes}
                onSelectGoal={(minutes) => settingsActions.updateSettings({ dailyGoalMinutes: minutes })}
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
        ...theme.shadows.sm,
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
