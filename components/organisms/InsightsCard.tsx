import React from 'react';
import { View, Text } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface InsightsCardProps {
    wordsLearned: number;
    averageAccuracy: number;
    totalReadingTimeMs: number;
}

export const InsightsCard: React.FC<InsightsCardProps> = ({
    wordsLearned,
    averageAccuracy,
    totalReadingTimeMs
}) => {
    const { t } = useTranslation();
    const { theme } = useUnistyles();

    const formatTime = (ms: number) => {
        const totalMinutes = Math.floor(ms / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    const metrics = [
        {
            label: t('profile.insights.wordsLearned', 'Words Learned'),
            value: wordsLearned,
            icon: 'school-outline' as const,
            color: theme.colors.primary,
        },
        {
            label: t('profile.insights.accuracy', 'Quiz Accuracy'),
            value: `${averageAccuracy}%`,
            icon: 'checkmark-circle-outline' as const,
            color: theme.colors.success,
        },
        {
            label: t('profile.insights.readingTime', 'Reading Time'),
            value: formatTime(totalReadingTimeMs),
            icon: 'time-outline' as const,
            color: theme.colors.warning,
        },
    ];

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{t('profile.insights.title', 'Learning Insights')}</Text>
            <View style={styles.grid}>
                {metrics.map((metric) => (
                    <View key={metric.label} style={styles.metricItem}>
                        <View style={[styles.iconContainer, { backgroundColor: `${metric.color}15` }]}>
                            <Ionicons name={metric.icon} size={20} color={metric.color} />
                        </View>
                        <Text style={styles.value}>{metric.value}</Text>
                        <Text style={styles.label}>{metric.label}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        marginHorizontal: 20,
        padding: 16,
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        marginBottom: 16,
        ...theme.shadows.sm,
    },
    title: {
        fontSize: theme.typography.size.lg,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.lg,
    },
    grid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: theme.spacing.md,
    },
    metricItem: {
        flex: 1,
        alignItems: 'center',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.sm,
    },
    value: {
        fontSize: theme.typography.size.xl,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    label: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.textMuted,
        textAlign: 'center',
        marginTop: 4,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
}));
