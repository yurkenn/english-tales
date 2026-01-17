import { FC } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, Theme, semanticColors } from '@/theme';
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

export const StoriesStatsRow: FC<StoriesStatsRowProps> = ({
    stats,
    activeFilter,
    onFilterChange,
}) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);

    const handlePress = (filter: DifficultyFilter) => {
        haptics.selection();
        onFilterChange(filter);
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.statItem} onPress={() => handlePress('all')} activeOpacity={0.7}>
                <Text style={[styles.statValue, activeFilter === 'all' && styles.statValueActive]}>
                    {stats.total}
                </Text>
                <Text style={styles.statLabel}>All</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.statItem} onPress={() => handlePress('beginner')} activeOpacity={0.7}>
                <Text style={[styles.statValue, { color: activeFilter === 'beginner' ? semanticColors.level.beginner : theme.colors.text }]}>
                    {stats.beginner}
                </Text>
                <Text style={styles.statLabel}>Easy</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.statItem} onPress={() => handlePress('intermediate')} activeOpacity={0.7}>
                <Text style={[styles.statValue, { color: activeFilter === 'intermediate' ? semanticColors.level.intermediate : theme.colors.text }]}>
                    {stats.intermediate}
                </Text>
                <Text style={styles.statLabel}>Medium</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.statItem} onPress={() => handlePress('advanced')} activeOpacity={0.7}>
                <Text style={[styles.statValue, { color: activeFilter === 'advanced' ? semanticColors.level.advanced : theme.colors.text }]}>
                    {stats.advanced}
                </Text>
                <Text style={styles.statLabel}>Hard</Text>
            </TouchableOpacity>
        </View>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
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
});
