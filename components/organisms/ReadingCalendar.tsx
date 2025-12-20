import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { LinearGradient } from 'expo-linear-gradient';

interface ReadingDay {
    date: Date;
    activityLevel: number;
    hasActivity: boolean;
}

interface ReadingCalendarProps {
    readingData?: Record<string, number>; // date string -> activity count
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function ReadingCalendar({ readingData = {} }: ReadingCalendarProps) {
    const { theme } = useUnistyles();

    // Generate last 7 days
    const weekData = useMemo(() => {
        const days: ReadingDay[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const activityCount = readingData[dateStr] || 0;
            const hasActivity = activityCount > 0;

            // Map activity count to intensity level (0-4)
            let activityLevel = 0;
            if (activityCount >= 5) activityLevel = 4;
            else if (activityCount >= 3) activityLevel = 3;
            else if (activityCount >= 2) activityLevel = 2;
            else if (activityCount >= 1) activityLevel = 1;

            days.push({
                date,
                activityLevel,
                hasActivity,
            });
        }

        return days;
    }, [readingData]);

    // Calculate streak
    const currentStreak = useMemo(() => {
        let streak = 0;
        for (let i = weekData.length - 1; i >= 0; i--) {
            if (weekData[i].hasActivity) {
                streak++;
            } else if (i < weekData.length - 1) {
                // Don't break if today has no activity yet
                break;
            }
        }
        return streak;
    }, [weekData]);

    // Get intensity color based on activity level
    const getIntensityColor = (level: number) => {
        if (level === 0) return theme.colors.borderLight;
        const opacityMap: Record<number, string> = {
            1: '40',
            2: '60',
            3: '80',
            4: '100',
        };
        const opacity = opacityMap[level] || '40';
        return `${theme.colors.primary}${opacity}`;
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>This Week</Text>
                <View style={styles.streakBadge}>
                    <LinearGradient
                        colors={[`${theme.colors.warning}30`, `${theme.colors.warning}10`]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFill}
                    />
                    <Text style={styles.streakIcon}>🔥</Text>
                    <Text style={styles.streakText}>{currentStreak} day streak</Text>
                </View>
            </View>

            <View style={styles.calendarRow}>
                {weekData.map((day, index) => (
                    <View key={index} style={styles.dayColumn}>
                        <Text style={styles.dayLabel}>
                            {WEEKDAYS[day.date.getDay()]}
                        </Text>
                        <View
                            style={[
                                styles.dayCell,
                                { backgroundColor: getIntensityColor(day.activityLevel) },
                                day.hasActivity && styles.dayCellActive,
                            ]}
                        >
                            {day.hasActivity && (
                                <Text style={styles.checkmark}>✓</Text>
                            )}
                        </View>
                        <Text style={styles.dateLabel}>
                            {day.date.getDate()}
                        </Text>
                    </View>
                ))}
            </View>

            <View style={styles.legend}>
                <Text style={styles.legendText}>Less</Text>
                <View style={styles.legendCells}>
                    {[0, 1, 2, 3, 4].map((level, index) => (
                        <View
                            key={index}
                            style={[
                                styles.legendCell,
                                { backgroundColor: getIntensityColor(level) },
                            ]}
                        />
                    ))}
                </View>
                <Text style={styles.legendText}>More</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create((theme) => ({
    container: {
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xl,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.sm,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    title: {
        fontSize: theme.typography.size.lg,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
        backgroundColor: `${theme.colors.warning}20`,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.radius.full,
    },
    streakIcon: {
        fontSize: theme.typography.size.sm,
    },
    streakText: {
        fontSize: theme.typography.size.sm,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.warning,
    },
    calendarRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.md,
    },
    dayColumn: {
        alignItems: 'center',
        gap: theme.spacing.sm,
        flex: 1,
    },
    dayLabel: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.textMuted,
        fontWeight: theme.typography.weight.medium,
    },
    dayCell: {
        width: 40,
        height: 40,
        borderRadius: theme.radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    dayCellActive: {
        borderWidth: 2,
        borderColor: theme.colors.primary,
    },
    checkmark: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textInverse,
        fontWeight: theme.typography.weight.bold,
    },
    dateLabel: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.textSecondary,
        fontWeight: theme.typography.weight.medium,
    },
    legend: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        paddingTop: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
    },
    legendText: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.textMuted,
        fontWeight: theme.typography.weight.medium,
    },
    legendCells: {
        flexDirection: 'row',
        gap: theme.spacing.xs,
    },
    legendCell: {
        width: 12,
        height: 12,
        borderRadius: theme.radius.xs,
    },
}));
