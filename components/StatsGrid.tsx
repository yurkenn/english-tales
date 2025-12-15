import React from 'react';
import { View, Text } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';

interface StatItem {
    label: string;
    value: string | number;
    icon: 'book' | 'document-text' | 'flame' | 'time';
}

interface StatsGridProps {
    stats: StatItem[];
}

export const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => {
    const { theme } = useUnistyles();

    return (
        <View style={styles.container}>
            {stats.map((stat) => (
                <View key={stat.label} style={styles.statCard}>
                    <View style={styles.iconContainer}>
                        <Ionicons name={stat.icon} size={20} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.value}>{stat.value}</Text>
                    <Text style={styles.label}>{stat.label}</Text>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
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
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: theme.radius.full,
        backgroundColor: `${theme.colors.primary}15`,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.sm,
    },
    value: {
        fontSize: theme.typography.size.xxl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    label: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textSecondary,
    },
}));
