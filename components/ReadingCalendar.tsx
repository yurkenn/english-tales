import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

interface ReadingDay {
    date: Date;
    minutesRead: number;
    hasActivity: boolean;
}

interface ReadingCalendarProps {
    readingData?: Record<string, number>; // date string -> minutes read
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function ReadingCalendar({ readingData = {} }: ReadingCalendarProps) {
    const { theme } = useUnistyles();

    // Generate last 7 days
    const weekData = useMemo(() => {
        const days: ReadingDay[] = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const minutesRead = readingData[dateStr] || 0;

            days.push({
                date,
                minutesRead,
                hasActivity: minutesRead > 0,
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

    // Get intensity color based on minutes
    const getIntensityColor = (minutes: number) => {
        if (minutes === 0) return theme.colors.borderLight;
        if (minutes < 5) return `${theme.colors.primary}30`;
        if (minutes < 15) return `${theme.colors.primary}50`;
        if (minutes < 30) return `${theme.colors.primary}80`;
        return theme.colors.primary;
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>This Week</Text>
                <View style={styles.streakBadge}>
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
                                { backgroundColor: getIntensityColor(day.minutesRead) },
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
                    {[0, 5, 15, 30, 60].map((minutes, index) => (
                        <View
                            key={index}
                            style={[
                                styles.legendCell,
                                { backgroundColor: getIntensityColor(minutes) },
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
        marginVertical: theme.spacing.md,
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xl,
        ...theme.shadows.sm,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    title: {
        fontSize: theme.typography.size.lg,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: `${theme.colors.warning}20`,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: theme.radius.full,
    },
    streakIcon: {
        fontSize: 14,
    },
    streakText: {
        fontSize: theme.typography.size.sm,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.warning,
    },
    calendarRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dayColumn: {
        alignItems: 'center',
        gap: 6,
    },
    dayLabel: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.textMuted,
        fontWeight: theme.typography.weight.medium,
    },
    dayCell: {
        width: 36,
        height: 36,
        borderRadius: theme.radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayCellActive: {
        borderWidth: 2,
        borderColor: theme.colors.primary,
    },
    checkmark: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: theme.typography.weight.bold,
    },
    dateLabel: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.textSecondary,
    },
    legend: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        marginTop: theme.spacing.md,
        paddingTop: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
    },
    legendText: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.textMuted,
    },
    legendCells: {
        flexDirection: 'row',
        gap: 4,
    },
    legendCell: {
        width: 16,
        height: 16,
        borderRadius: 4,
    },
}));
