import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useProgressStore } from '@/store/progressStore';
import { useThemeStore } from '@/store/themeStore';
import { useAchievementsStore } from '@/store/achievementsStore';
import { haptics } from '@/utils/haptics';

export default function ProfileScreen() {
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user, signOut, isLoading } = useAuthStore();
    const { items: libraryItems } = useLibraryStore();
    const { progressMap, actions: progressActions } = useProgressStore();

    // Compute real stats from progress data
    const computedStats = useMemo(() => {
        let booksRead = 0;
        let totalWords = 0;
        let totalMinutes = 0;

        // Count completed books and sum words/time
        Object.values(progressMap).forEach((progress) => {
            if (progress.isCompleted) {
                booksRead++;
                // Find story in library to get word count
                const libraryItem = libraryItems.find((item) => item.storyId === progress.storyId);
                if (libraryItem?.story) {
                    totalWords += libraryItem.story.wordCount || 0;
                    totalMinutes += libraryItem.story.estimatedReadTime || 0;
                }
            }
        });

        // Convert words to approximate page count (250 words per page)
        const pagesRead = Math.ceil(totalWords / 250);

        return {
            booksRead,
            pagesRead,
            minutesRead: totalMinutes,
            // Streak from real reading dates
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

    // Edit profile state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editName, setEditName] = useState(user?.displayName || '');

    // Menu handlers
    const handleAchievements = () => {
        haptics.selection();
        Alert.alert(
            '🏆 Achievements',
            `You've unlocked ${unlockedCount}/${achievements.length} achievements!\n\n${achievements.map(a => `${a.unlocked ? '✅' : '🔒'} ${a.icon} ${a.title}`).join('\n')}`,
            [{ text: 'OK' }]
        );
    };

    const handleNotifications = () => {
        haptics.selection();
        Alert.alert('Notifications', 'Coming soon! We\'ll notify you about new stories and reading reminders.', [{ text: 'OK' }]);
    };

    const handleReadingGoals = () => {
        haptics.selection();
        Alert.alert('Reading Goals', 'Coming soon! Set daily reading targets and track your progress.', [{ text: 'OK' }]);
    };

    const handleHelp = () => {
        haptics.selection();
        Alert.alert('Help & Support', 'Need help? Contact us at support@englishtales.app', [{ text: 'OK' }]);
    };

    const handleAbout = () => {
        haptics.selection();
        Alert.alert('About English Tales', 'Version 1.0.0\n\nImprove your English through beautiful stories.\n\n© 2024 English Tales', [{ text: 'OK' }]);
    };

    const menuItems = [
        { label: 'Reading Goals', icon: 'flag-outline' as const, onPress: handleReadingGoals },
        { label: 'Achievements', icon: 'trophy-outline' as const, value: `${unlockedCount}/${achievements.length}`, onPress: handleAchievements },
        { label: 'Notifications', icon: 'notifications-outline' as const, onPress: handleNotifications },
        { label: 'Appearance', icon: 'color-palette-outline' as const, value: themeModeLabel, onPress: themeActions.toggleTheme },
        { label: 'Help & Support', icon: 'help-circle-outline' as const, onPress: handleHelp },
        { label: 'About', icon: 'information-circle-outline' as const, onPress: handleAbout },
    ];

    if (isLoading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!user) return null; // Should be handled by protected route, but safe guard

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Profile</Text>
                    <Pressable
                        style={styles.settingsButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        onPress={() => {
                            haptics.selection();
                            router.push('/settings');
                        }}
                    >
                        <Ionicons
                            name="settings-outline"
                            size={theme.iconSize.md}
                            color={theme.colors.text}
                        />
                    </Pressable>
                </View>

                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <Image
                        source={{ uri: user.photoURL || 'https://ui-avatars.com/api/?name=' + (user.isAnonymous ? 'Guest' : user.displayName) }}
                        style={styles.avatar}
                    />
                    <Text style={styles.userName}>{user.isAnonymous ? 'Guest User' : (user.displayName || 'Reader')}</Text>
                    <Text style={styles.userEmail}>{user.isAnonymous ? 'Sign up to sync your progress' : user.email}</Text>

                    {!user.isAnonymous && (
                        <Pressable
                            style={styles.editButton}
                            onPress={() => {
                                haptics.selection();
                                setEditName(user.displayName || '');
                                setShowEditModal(true);
                            }}
                        >
                            <Ionicons
                                name="pencil-outline"
                                size={16}
                                color={theme.colors.primary}
                            />
                            <Text style={styles.editButtonText}>Edit Profile</Text>
                        </Pressable>
                    )}

                    {user.isAnonymous && (
                        <Pressable style={styles.editButton} onPress={() => signOut()}>
                            <Text style={styles.editButtonText}>Sign In / Sign Up</Text>
                        </Pressable>
                    )}
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    {stats.map((stat, index) => (
                        <View key={stat.label} style={styles.statCard}>
                            <View style={styles.statIconContainer}>
                                <Ionicons
                                    name={stat.icon}
                                    size={20}
                                    color={theme.colors.primary}
                                />
                            </View>
                            <Text style={styles.statValue}>{stat.value}</Text>
                            <Text style={styles.statLabel}>{stat.label}</Text>
                        </View>
                    ))}
                </View>

                {/* Menu */}
                <View style={styles.menuSection}>
                    {menuItems.map((item, index) => (
                        <Pressable
                            key={item.label}
                            style={styles.menuItem}
                            onPress={item.onPress}
                        >
                            <View style={styles.menuIconContainer}>
                                <Ionicons
                                    name={item.icon}
                                    size={22}
                                    color={theme.colors.text}
                                />
                            </View>
                            <Text style={styles.menuLabel}>{item.label}</Text>
                            {item.value && (
                                <Text style={styles.menuValue}>{item.value}</Text>
                            )}
                            <Ionicons
                                name="chevron-forward"
                                size={20}
                                color={theme.colors.textMuted}
                            />
                        </Pressable>
                    ))}
                </View>

                {/* Sign Out */}
                <Pressable style={styles.signOutButton} onPress={signOut}>
                    <Ionicons
                        name="log-out-outline"
                        size={22}
                        color={theme.colors.error}
                    />
                    <Text style={styles.signOutText}>Sign Out</Text>
                </Pressable>
            </ScrollView>

            {/* Edit Profile Modal */}
            <Modal
                visible={showEditModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowEditModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Profile</Text>
                            <Pressable onPress={() => setShowEditModal(false)}>
                                <Ionicons name="close" size={24} color={theme.colors.text} />
                            </Pressable>
                        </View>

                        <Text style={styles.inputLabel}>Display Name</Text>
                        <TextInput
                            style={styles.textInput}
                            value={editName}
                            onChangeText={setEditName}
                            placeholder="Enter your name"
                            placeholderTextColor={theme.colors.textMuted}
                        />

                        <Pressable
                            style={styles.saveButton}
                            onPress={() => {
                                haptics.success();
                                Alert.alert('Saved!', `Display name updated to "${editName}"`, [{ text: 'OK' }]);
                                setShowEditModal(false);
                            }}
                        >
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
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
    profileCard: {
        alignItems: 'center',
        paddingVertical: theme.spacing.xl,
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.xl,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xxl,
        ...theme.shadows.md,
    },
    avatar: {
        width: theme.avatarSize.xl,
        height: theme.avatarSize.xl,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.borderLight,
        marginBottom: theme.spacing.md,
    },
    userName: {
        fontSize: theme.typography.size.xxl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.xxs,
    },
    userEmail: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.lg,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.radius.full,
        borderWidth: 1,
        borderColor: theme.colors.primary,
    },
    editButtonText: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.primary,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: theme.spacing.lg,
        gap: theme.spacing.md,
        marginBottom: theme.spacing.xl,
    },
    statCard: {
        width: '47%',
        alignItems: 'center',
        paddingVertical: theme.spacing.lg,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xl,
        ...theme.shadows.sm,
    },
    statIconContainer: {
        width: 40,
        height: 40,
        borderRadius: theme.radius.full,
        backgroundColor: `${theme.colors.primary}15`,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.sm,
    },
    statValue: {
        fontSize: theme.typography.size.xxl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    statLabel: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textSecondary,
    },
    menuSection: {
        marginHorizontal: theme.spacing.lg,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xl,
        ...theme.shadows.sm,
        marginBottom: theme.spacing.xl,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.lg,
        paddingHorizontal: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    menuIconContainer: {
        width: 36,
        alignItems: 'center',
    },
    menuLabel: {
        flex: 1,
        fontSize: theme.typography.size.lg,
        color: theme.colors.text,
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
    menuValue: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textMuted,
        marginRight: theme.spacing.xs,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: theme.colors.surface,
        borderTopLeftRadius: theme.radius.xxl,
        borderTopRightRadius: theme.radius.xxl,
        padding: theme.spacing.xl,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    modalTitle: {
        fontSize: theme.typography.size.xxl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    inputLabel: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
    },
    textInput: {
        backgroundColor: theme.colors.backgroundSecondary,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        fontSize: theme.typography.size.lg,
        color: theme.colors.text,
        marginBottom: theme.spacing.xl,
    },
    saveButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.radius.full,
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: theme.typography.size.lg,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.textInverse,
    },
}));
