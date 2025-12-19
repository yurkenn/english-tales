import React from 'react';
import { View, Text } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';

interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    unlocked: boolean;
    unlockedAt?: Date;
}

interface AchievementCardProps {
    achievement: Achievement;
}

const formatDate = (date: Date | undefined): string => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

export const AchievementCard: React.FC<AchievementCardProps> = ({ achievement }) => {
    const { theme } = useUnistyles();

    return (
        <View style={[styles.card, !achievement.unlocked && styles.cardLocked]}>
            <View style={[styles.iconContainer, !achievement.unlocked && styles.iconContainerLocked]}>
                <Text style={styles.iconText}>{achievement.icon}</Text>
                {!achievement.unlocked && (
                    <View style={styles.lockOverlay}>
                        <Ionicons name="lock-closed" size={24} color={theme.colors.textMuted} />
                    </View>
                )}
            </View>
            <Text style={[styles.title, !achievement.unlocked && styles.titleLocked]}>
                {achievement.title}
            </Text>
            <Text style={[styles.description, !achievement.unlocked && styles.descriptionLocked]}>
                {achievement.description}
            </Text>
            {achievement.unlocked && achievement.unlockedAt && (
                <Text style={styles.unlockedDate}>
                    Unlocked {formatDate(achievement.unlockedAt)}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    card: {
        width: '48%',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xl,
        padding: theme.spacing.lg,
        alignItems: 'center',
        ...theme.shadows.sm,
    },
    cardLocked: {
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
    title: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: theme.spacing.xs,
    },
    titleLocked: {
        color: theme.colors.textMuted,
    },
    description: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: theme.spacing.xs,
    },
    descriptionLocked: {
        color: theme.colors.textMuted,
    },
    unlockedDate: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.primary,
        fontWeight: theme.typography.weight.medium,
        marginTop: theme.spacing.xs,
    },
}));
