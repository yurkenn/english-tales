import React from 'react';
import { View, Text } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

interface StatBarProps {
    label: string;
    value: number;
    maxValue: number;
    color?: string;
}

export const StatBar: React.FC<StatBarProps> = ({
    label,
    value,
    maxValue,
    color,
}) => {
    const { theme } = useUnistyles();
    const percentage = Math.min((value / maxValue) * 100, 100);
    const barColor = color || theme.colors.primary;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.value}>{value}</Text>
            </View>
            <View style={styles.barBackground}>
                <View
                    style={[
                        styles.barFill,
                        { width: `${percentage}%`, backgroundColor: barColor }
                    ]}
                />
            </View>
        </View>
    );
};

interface WeeklyChartProps {
    data: number[];
    labels?: string[];
}

export const WeeklyChart: React.FC<WeeklyChartProps> = ({
    data,
    labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
}) => {
    const { theme } = useUnistyles();
    const maxValue = Math.max(...data, 1);

    return (
        <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>This Week</Text>
            <View style={styles.barsRow}>
                {data.map((value, index) => {
                    const height = Math.max((value / maxValue) * 60, 4);
                    const isToday = index === new Date().getDay() - 1 || (index === 6 && new Date().getDay() === 0);
                    return (
                        <View key={index} style={styles.barColumn}>
                            <View
                                style={[
                                    styles.chartBar,
                                    {
                                        height,
                                        backgroundColor: isToday ? theme.colors.primary : theme.colors.primaryLight
                                    }
                                ]}
                            />
                            <Text style={[styles.barLabel, isToday && styles.barLabelActive]}>
                                {labels[index]}
                            </Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        marginBottom: theme.spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.xs,
    },
    label: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textSecondary,
    },
    value: {
        fontSize: theme.typography.size.sm,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.text,
    },
    barBackground: {
        height: 8,
        backgroundColor: theme.colors.backgroundSecondary,
        borderRadius: theme.radius.full,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: theme.radius.full,
    },
    chartContainer: {
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xl,
        ...theme.shadows.sm,
    },
    chartTitle: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    barsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 80,
    },
    barColumn: {
        alignItems: 'center',
        flex: 1,
    },
    chartBar: {
        width: 24,
        borderRadius: theme.radius.sm,
        marginBottom: theme.spacing.xs,
    },
    barLabel: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.textMuted,
    },
    barLabelActive: {
        color: theme.colors.primary,
        fontWeight: theme.typography.weight.bold,
    },
}));
