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

const getIconColor = (icon: string, theme: any): string => {
    switch (icon) {
        case 'flame': return '#FF6B35';
        case 'book': return theme.colors.primary;
        case 'time': return '#6366F1';
        case 'document-text': return '#10B981';
        default: return theme.colors.primary;
    }
};

const getIconBg = (icon: string): string => {
    switch (icon) {
        case 'flame': return 'rgba(255, 107, 53, 0.12)';
        case 'book': return 'rgba(234, 42, 51, 0.12)';
        case 'time': return 'rgba(99, 102, 241, 0.12)';
        case 'document-text': return 'rgba(16, 185, 129, 0.12)';
        default: return 'rgba(234, 42, 51, 0.12)';
    }
};

export const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => {
    const { theme } = useUnistyles();

    return (
        <View style={styles.container}>
            {stats.map((stat, index) => {
                const iconColor = getIconColor(stat.icon, theme);
                const iconBg = getIconBg(stat.icon);

                return (
                    <View key={stat.label} style={styles.statCard}>
                        <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
                            <Ionicons name={stat.icon} size={22} color={iconColor} />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.value}>{stat.value}</Text>
                            <Text style={styles.label}>{stat.label}</Text>
                        </View>
                    </View>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: theme.spacing.lg,
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.lg,
    },
    statCard: {
        width: '48%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: theme.radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textContainer: {
        flex: 1,
    },
    value: {
        fontSize: theme.typography.size.xl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    label: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
}));
