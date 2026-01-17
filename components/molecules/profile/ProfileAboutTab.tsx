import { FC, memo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, Theme, semanticColors } from '@/theme';

import { Typography } from '@/components/atoms';
import { ProfileMenuItem } from '@/components/molecules/ProfileMenuItem';

// Minimal interface - only need length for display
interface Achievement {
    id: string;
}

interface ProfileStats {
    booksRead: number;
    readingHours: number;
    vocabCount: number;
    postsCount: number;
    streak: number;
}

interface ProfileAboutTabProps {
    stats: ProfileStats;
    achievements: Achievement[];
    unlockedCount: number;
    settings: {
        dailyGoalMinutes: number;
        language: string;
    };
    themeModeLabel: string;
    currentLanguageLabel: string;
    onGoalsPress: () => void;
    onLanguagePress: () => void;
    onThemeToggle: () => void;
    onSignOut: () => void;
}

export const ProfileAboutTab: FC<ProfileAboutTabProps> = memo(({
    stats,
    achievements,
    unlockedCount,
    settings,
    themeModeLabel,
    currentLanguageLabel,
    onGoalsPress,
    onLanguagePress,
    onThemeToggle,
    onSignOut,
}) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const router = useRouter();
    const styles = createStyles(theme);

    return (
        <View style={styles.aboutContainer}>
            {/* Quick Stats */}
            <View style={styles.quickStatsCard}>
                <View style={styles.quickStatsRow}>
                    <QuickStatItem
                        icon="book"
                        value={Math.round(stats.booksRead)}
                        label={t('profile.books', 'Books')}
                        color={theme.colors.primary}
                    />
                    <QuickStatItem
                        icon="time"
                        value={`${Math.round(stats.readingHours)}h`}
                        label={t('profile.reading', 'Hours')}
                        color={semanticColors.level.intermediate}
                    />
                    <QuickStatItem
                        icon="text"
                        value={Math.round(stats.vocabCount)}
                        label={t('profile.words', 'Words')}
                        color={semanticColors.level.beginner}
                    />
                    <QuickStatItem
                        icon="trophy"
                        value={unlockedCount}
                        label={t('profile.badges', 'Badges')}
                        color="#8B5CF6"
                    />
                </View>
            </View>

            {/* Activity Menu */}
            <View style={styles.menuSection}>
                <Typography style={styles.menuSectionTitle}>
                    {t('profile.activity', 'Activity')}
                </Typography>
                <View style={styles.menuCard}>
                    <ProfileMenuItem
                        icon="trophy-outline"
                        label={t('profile.achievements')}
                        value={`${unlockedCount}/${achievements.length}`}
                        onPress={() => router.push('/achievements')}
                    />
                    <ProfileMenuItem
                        icon="bookmark-outline"
                        label={t('profile.vocabulary')}
                        value={`${stats.vocabCount}`}
                        onPress={() => router.push('/user/vocabulary')}
                    />
                    <ProfileMenuItem
                        icon="school-outline"
                        label={t('profile.quiz', 'Practice Quiz')}
                        onPress={() => router.push('/user/quiz')}
                    />
                    <ProfileMenuItem
                        icon="people-outline"
                        label={t('social.following')}
                        onPress={() => router.push('/social' as any)}
                        isLast
                    />
                </View>
            </View>

            {/* Settings Menu */}
            <View style={styles.menuSection}>
                <Typography style={styles.menuSectionTitle}>
                    {t('profile.preferences', 'Preferences')}
                </Typography>
                <View style={styles.menuCard}>
                    <ProfileMenuItem
                        icon="flag-outline"
                        label={t('profile.readingGoals')}
                        value={`${settings.dailyGoalMinutes} min`}
                        onPress={onGoalsPress}
                    />
                    <ProfileMenuItem
                        icon="language-outline"
                        label={t('profile.language')}
                        value={currentLanguageLabel}
                        onPress={onLanguagePress}
                    />
                    <ProfileMenuItem
                        icon="color-palette-outline"
                        label={t('profile.appearance')}
                        value={themeModeLabel}
                        onPress={onThemeToggle}
                    />
                    <ProfileMenuItem
                        icon="settings-outline"
                        label={t('profile.allSettings', 'All Settings')}
                        onPress={() => router.push('/settings')}
                        isLast
                    />
                </View>
            </View>

            {/* Sign Out */}
            <Pressable
                style={styles.signOutButton}
                onPress={onSignOut}
                android_ripple={{ color: theme.colors.error + '20' }}
            >
                <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
                <Typography style={[styles.signOutText, { color: theme.colors.error }]}>
                    {t('profile.signOut', 'Sign Out')}
                </Typography>
            </Pressable>
        </View>
    );
});

ProfileAboutTab.displayName = 'ProfileAboutTab';

// Quick Stat Item sub-component
interface QuickStatItemProps {
    icon: string;
    value: string | number;
    label: string;
    color: string;
}

const QuickStatItem: FC<QuickStatItemProps> = memo(({ icon, value, label, color }) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);

    return (
        <View style={styles.quickStatItem}>
            <View style={[styles.quickStatIcon, { backgroundColor: color + '15' }]}>
                <Ionicons name={icon as any} size={18} color={color} />
            </View>
            <Typography style={styles.quickStatValue}>{value}</Typography>
            <Typography style={styles.quickStatLabel}>{label}</Typography>
        </View>
    );
});

function createStyles(theme: Theme) {
    return StyleSheet.create({
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
    });
}
