import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { haptics } from '@/utils/haptics';
import { type DifficultyFilter } from '../molecules/moleculeTypes';

interface StoriesStatsRowProps {
    stats: {
        total: number;
        beginner: number;
        intermediate: number;
        advanced: number;
    };
    activeFilter: DifficultyFilter;
    onFilterChange: (filter: DifficultyFilter) => void;
}

export const StoriesStatsRow: React.FC<StoriesStatsRowProps> = ({
    stats,
    activeFilter,
    onFilterChange,
}) => {
    const { theme } = useUnistyles();

    const handlePress = (filter: DifficultyFilter) => {
        haptics.selection();
        onFilterChange(filter);
    };

    return (
        <View style={styles.container}>
            <Pressable style={styles.statItem} onPress={() => handlePress('all')}>
                <Text style={[styles.statValue, activeFilter === 'all' && styles.statValueActive]}>
                    {stats.total}
                </Text>
                <Text style={styles.statLabel}>All</Text>
            </Pressable>
            <View style={styles.divider} />
            <Pressable style={styles.statItem} onPress={() => handlePress('beginner')}>
                <Text style={[styles.statValue, { color: activeFilter === 'beginner' ? '#10B981' : theme.colors.text }]}>
                    {stats.beginner}
                </Text>
                <Text style={styles.statLabel}>Easy</Text>
            </Pressable>
            <View style={styles.divider} />
            <Pressable style={styles.statItem} onPress={() => handlePress('intermediate')}>
                <Text style={[styles.statValue, { color: activeFilter === 'intermediate' ? '#F59E0B' : theme.colors.text }]}>
                    {stats.intermediate}
                </Text>
                <Text style={styles.statLabel}>Medium</Text>
            </Pressable>
            <View style={styles.divider} />
            <Pressable style={styles.statItem} onPress={() => handlePress('advanced')}>
                <Text style={[styles.statValue, { color: activeFilter === 'advanced' ? '#EF4444' : theme.colors.text }]}>
                    {stats.advanced}
                </Text>
                <Text style={styles.statLabel}>Hard</Text>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xl,
        ...theme.shadows.sm,
    },
    statItem: {
        alignItems: 'center',
        gap: 2,
        paddingHorizontal: theme.spacing.sm,
    },
    statValue: {
        fontSize: theme.typography.size.xl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    statValueActive: {
        color: theme.colors.primary,
    },
    statLabel: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.textSecondary,
    },
    divider: {
        width: 1,
        height: 28,
        backgroundColor: theme.colors.border,
    },
}));
