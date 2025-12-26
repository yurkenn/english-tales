import React from 'react';
import { View, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Typography } from '../atoms/Typography';
import { haptics } from '@/utils/haptics';
import { DailyStat } from '@/types';

interface DailyGoalCardProps {
    stats: DailyStat | null;
    onPress?: () => void;
}

export const DailyGoalCard: React.FC<DailyGoalCardProps> = ({ stats, onPress }) => {
    const { t } = useTranslation();
    const { theme } = useUnistyles();

    if (!stats) return null;

    const progress = Math.min(stats.minutesRead / stats.goalMinutes, 1);
    const isCompleted = stats.isGoalReached;
    const remaining = Math.max(stats.goalMinutes - stats.minutesRead, 0);

    return (
        <Pressable
            style={[styles.container, { backgroundColor: theme.colors.surface }]}
            onPress={() => {
                haptics.selection();
                onPress?.();
            }}
        >
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <View style={[styles.iconWrapper, { backgroundColor: isCompleted ? '#10B98120' : theme.colors.primary + '15' }]}>
                        <Ionicons
                            name={isCompleted ? "checkmark-circle" : "flag"}
                            size={20}
                            color={isCompleted ? '#10B981' : theme.colors.primary}
                        />
                    </View>
                    <Typography style={styles.title}>
                        {isCompleted ? t('profile.goalReached', 'Goal Reached!') : t('profile.dailyGoal', 'Daily Goal')}
                    </Typography>
                </View>
                <Typography style={styles.percentage}>
                    {Math.round(progress * 100)}%
                </Typography>
            </View>

            <View style={styles.progressSection}>
                <View style={[styles.progressBackground, { backgroundColor: theme.colors.borderLight }]}>
                    <View
                        style={[
                            styles.progressBar,
                            {
                                width: `${progress * 100}%`,
                                backgroundColor: isCompleted ? '#10B981' : theme.colors.primary
                            }
                        ]}
                    />
                </View>

                <View style={styles.statsRow}>
                    <Typography style={styles.minutesLabel}>
                        <Typography style={styles.minutesValue}>{Math.round(stats.minutesRead)}</Typography>
                        {` / ${stats.goalMinutes} ${t('common.min', 'min')}`}
                    </Typography>

                    {!isCompleted && (
                        <Typography style={styles.timeRemaining}>
                            {t('profile.minRemaining', { count: Math.ceil(remaining) })}
                        </Typography>
                    )}
                </View>
            </View>

            {!isCompleted && (
                <View style={styles.footer}>
                    <Typography style={styles.footerText}>
                        {progress > 0.7
                            ? t('profile.goalAlmost', "You're almost there!")
                            : t('profile.goalKeepGoing', "Keep reading to reach your goal!")}
                    </Typography>
                </View>
            )}
        </Pressable>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        padding: theme.spacing.xl,
        borderRadius: theme.radius.xxl,
        ...theme.shadows.md,
        marginHorizontal: theme.spacing.lg,
        marginTop: theme.spacing.xl,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    iconWrapper: {
        width: 36,
        height: 36,
        borderRadius: theme.radius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: theme.typography.size.md,
        fontWeight: '700',
        color: theme.colors.text,
    },
    percentage: {
        fontSize: theme.typography.size.sm,
        fontWeight: '700',
        color: theme.colors.textMuted,
    },
    progressSection: {
        gap: theme.spacing.sm,
    },
    progressBackground: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 4,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    minutesLabel: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textMuted,
    },
    minutesValue: {
        fontWeight: '700',
        color: theme.colors.text,
    },
    timeRemaining: {
        fontSize: theme.typography.size.xs,
        fontWeight: '600',
        color: theme.colors.primary,
    },
    footer: {
        marginTop: theme.spacing.lg,
        paddingTop: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
    },
    footerText: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textSecondary,
        fontStyle: 'italic',
    },
}));
