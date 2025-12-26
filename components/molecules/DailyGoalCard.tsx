import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { ReadingGoalRing } from '../atoms/ReadingGoalRing';
import { haptics } from '@/utils/haptics';
import { DailyStat } from '@/types';

interface DailyGoalCardProps {
    stats: DailyStat | null;
    onPress?: () => void;
}

export const DailyGoalCard: React.FC<DailyGoalCardProps> = ({
    stats,
    onPress,
}) => {
    const { t } = useTranslation();
    const { theme } = useUnistyles();

    const minutesRead = Math.round(stats?.minutesRead || 0);
    const goalMinutes = stats?.goalMinutes || 15;
    const progress = Math.min(1, minutesRead / goalMinutes);
    const isGoalReached = minutesRead >= goalMinutes;

    return (
        <Pressable
            style={styles.container}
            onPress={() => {
                haptics.light();
                onPress?.();
            }}
        >
            <View style={styles.content}>
                <View style={styles.textContainer}>
                    <Text style={styles.title}>{t('reading.dailyGoal', 'Daily Goal')}</Text>
                    <Text style={styles.stats}>
                        <Text style={styles.minutesRead}>{minutesRead}</Text>
                        <Text style={styles.separator}> / </Text>
                        <Text style={styles.goalMinutes}>{goalMinutes} {t('common.min', 'min')}</Text>
                    </Text>
                </View>

                <View style={styles.ringContainer}>
                    <ReadingGoalRing
                        progress={progress}
                        size={56}
                        strokeWidth={5}
                        showLabel={true}
                    />
                    {isGoalReached && (
                        <View style={styles.checkIcon}>
                            <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                        </View>
                    )}
                </View>
            </View>

            {!isGoalReached && (
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        {Math.max(0, Math.ceil(goalMinutes - (stats?.minutesRead || 0)))} {t('reading.minutesLeft', 'mins left to reach goal')}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
                </View>
            )}
        </Pressable>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xxl,
        padding: theme.spacing.xl,
        marginHorizontal: theme.spacing.lg,
        marginTop: theme.spacing.lg,
        ...theme.shadows.md,
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 11,
        color: theme.colors.textMuted,
        fontWeight: '700',
        marginBottom: theme.spacing.xs,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
    },
    stats: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    minutesRead: {
        fontSize: 28,
        fontWeight: '800',
        color: theme.colors.text,
    },
    separator: {
        fontSize: 18,
        color: theme.colors.textTertiary,
        marginHorizontal: 4,
    },
    goalMinutes: {
        fontSize: 18,
        color: theme.colors.textSecondary,
        fontWeight: '600',
    },
    ringContainer: {
        position: 'relative',
        marginLeft: theme.spacing.xl,
    },
    checkIcon: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.full,
        padding: 1,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: theme.spacing.lg,
        paddingTop: theme.spacing.lg,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
    },
    footerText: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.primary,
        fontWeight: '600',
    },
}));
