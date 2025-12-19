import React from 'react';
import { View, Text } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

interface AchievementsProgressCardProps {
    unlockedCount: number;
    totalCount: number;
}

export const AchievementsProgressCard: React.FC<AchievementsProgressCardProps> = ({
    unlockedCount,
    totalCount,
}) => {
    const progress = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Your Progress</Text>
                <Text style={styles.count}>{unlockedCount} / {totalCount}</Text>
            </View>
            <View style={styles.barContainer}>
                <View style={[styles.bar, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.text}>{Math.round(progress)}% Complete</Text>
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xl,
        padding: theme.spacing.xl,
        marginBottom: theme.spacing.xl,
        ...theme.shadows.sm,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    title: {
        fontSize: theme.typography.size.lg,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    count: {
        fontSize: theme.typography.size.lg,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.primary,
    },
    barContainer: {
        height: 8,
        backgroundColor: theme.colors.backgroundSecondary,
        borderRadius: theme.radius.full,
        overflow: 'hidden',
        marginBottom: theme.spacing.sm,
    },
    bar: {
        height: '100%',
        backgroundColor: theme.colors.primary,
        borderRadius: theme.radius.full,
    },
    text: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
}));
