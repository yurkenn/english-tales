import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAchievementsStore } from '@/store/achievementsStore';
import { haptics } from '@/utils/haptics';

export default function AchievementsScreen() {
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { actions: achievementActions } = useAchievementsStore();
    const achievements = achievementActions.getAll();

    const unlockedCount = achievements.filter(a => a.unlocked).length;
    const totalCount = achievements.length;
    const progress = (unlockedCount / totalCount) * 100;

    const formatDate = (date: Date | undefined): string => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable
                    style={styles.backButton}
                    onPress={() => {
                        haptics.selection();
                        router.back();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </Pressable>
                <Text style={styles.headerTitle}>Achievements</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                {/* Progress Section */}
                <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressTitle}>Your Progress</Text>
                        <Text style={styles.progressCount}>
                            {unlockedCount} / {totalCount}
                        </Text>
                    </View>
                    <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBar, { width: `${progress}%` }]} />
                    </View>
                    <Text style={styles.progressText}>{Math.round(progress)}% Complete</Text>
                </View>

                {/* Achievements Grid */}
                <View style={styles.achievementsGrid}>
                    {achievements.map((achievement) => (
                        <View
                            key={achievement.id}
                            style={[
                                styles.achievementCard,
                                !achievement.unlocked && styles.achievementCardLocked,
                            ]}
                        >
                            <View
                                style={[
                                    styles.iconContainer,
                                    !achievement.unlocked && styles.iconContainerLocked,
                                ]}
                            >
                                <Text style={styles.iconText}>{achievement.icon}</Text>
                                {!achievement.unlocked && (
                                    <View style={styles.lockOverlay}>
                                        <Ionicons
                                            name="lock-closed"
                                            size={24}
                                            color={theme.colors.textMuted}
                                        />
                                    </View>
                                )}
                            </View>
                            <Text
                                style={[
                                    styles.achievementTitle,
                                    !achievement.unlocked && styles.achievementTitleLocked,
                                ]}
                            >
                                {achievement.title}
                            </Text>
                            <Text
                                style={[
                                    styles.achievementDescription,
                                    !achievement.unlocked && styles.achievementDescriptionLocked,
                                ]}
                            >
                                {achievement.description}
                            </Text>
                            {achievement.unlocked && achievement.unlockedAt && (
                                <Text style={styles.unlockedDate}>
                                    Unlocked {formatDate(achievement.unlockedAt)}
                                </Text>
                            )}
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
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
        borderBottomColor: theme.colors.border,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: theme.typography.size.xl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    placeholder: {
        width: 40,
    },
    content: {
        padding: theme.spacing.lg,
        paddingBottom: theme.spacing.xxxl,
    },
    progressSection: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xl,
        padding: theme.spacing.xl,
        marginBottom: theme.spacing.xl,
        ...theme.shadows.sm,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    progressTitle: {
        fontSize: theme.typography.size.lg,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    progressCount: {
        fontSize: theme.typography.size.lg,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.primary,
    },
    progressBarContainer: {
        height: 8,
        backgroundColor: theme.colors.backgroundSecondary,
        borderRadius: theme.radius.full,
        overflow: 'hidden',
        marginBottom: theme.spacing.sm,
    },
    progressBar: {
        height: '100%',
        backgroundColor: theme.colors.primary,
        borderRadius: theme.radius.full,
    },
    progressText: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
    achievementsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.md,
    },
    achievementCard: {
        width: '48%',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xl,
        padding: theme.spacing.lg,
        alignItems: 'center',
        ...theme.shadows.sm,
    },
    achievementCardLocked: {
        opacity: 0.6,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: theme.radius.full,
        backgroundColor: `${theme.colors.primary}15`,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.md,
        position: 'relative',
    },
    iconContainerLocked: {
        backgroundColor: theme.colors.backgroundSecondary,
    },
    iconText: {
        fontSize: 32,
    },
    lockOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: theme.radius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    achievementTitle: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: theme.spacing.xs,
    },
    achievementTitleLocked: {
        color: theme.colors.textMuted,
    },
    achievementDescription: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: theme.spacing.xs,
    },
    achievementDescriptionLocked: {
        color: theme.colors.textMuted,
    },
    unlockedDate: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.primary,
        fontWeight: theme.typography.weight.medium,
        marginTop: theme.spacing.xs,
    },
}));
