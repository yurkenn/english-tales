import React from 'react';
import { View, Text } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

interface LibraryStatsRowProps {
    total: number;
    completed: number;
    inProgress: number;
}

export const LibraryStatsRow: React.FC<LibraryStatsRowProps> = ({
    total,
    completed,
    inProgress,
}) => {
    return (
        <View style={styles.statsRow}>
            <View style={styles.statItem}>
                <Text style={styles.statValue}>{total}</Text>
                <Text style={styles.statLabel}>Books</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
                <Text style={styles.statValue}>{completed}</Text>
                <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
                <Text style={styles.statValue}>{inProgress}</Text>
                <Text style={styles.statLabel}>In Progress</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.xl,
        paddingVertical: theme.spacing.lg,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xl,
        ...theme.shadows.sm,
    },
    statItem: {
        alignItems: 'center',
        gap: theme.spacing.xxs,
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
    statDivider: {
        width: 1,
        height: 32,
        backgroundColor: theme.colors.border,
    },
}));
