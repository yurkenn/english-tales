import { FC } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, Theme } from '@/theme';

interface LibraryStatsRowProps {
    total: number;
    completed: number;
    inProgress: number;
}

export const LibraryStatsRow: FC<LibraryStatsRowProps> = ({
    total,
    completed,
    inProgress,
}) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
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

const createStyles = (theme: Theme) => StyleSheet.create({
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
        paddingVertical: theme.spacing.xl,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.sm,
    },
    statItem: {
        alignItems: 'center',
        gap: theme.spacing.xxs,
    },
    statValue: {
        fontSize: theme.typography.size.xxl,
        fontWeight: 'bold',
        color: theme.colors.text,
        letterSpacing: -0.5,
    },
    statLabel: {
        fontSize: theme.typography.size.sm,
        fontWeight: '600',
        color: theme.colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statDivider: {
        width: 1,
        height: 32,
        backgroundColor: theme.colors.borderLight,
    },
});
