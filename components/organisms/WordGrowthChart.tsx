import React, { useMemo } from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { subDays, format, startOfDay, isSameDay } from 'date-fns';
import { useTranslation } from 'react-i18next';

interface ChartData {
    words: any[];
}

export const WordGrowthChart: React.FC<ChartData> = ({ words }) => {
    const { t } = useTranslation();
    const { theme } = useUnistyles();
    const { width: windowWidth } = useWindowDimensions();

    const chartData = useMemo(() => {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = subDays(new Date(), 6 - i);
            return {
                date,
                label: format(date, 'EEE'),
                count: 0,
            };
        });

        words.forEach((word) => {
            const wordDate = new Date(word.addedAt);
            const dayIndex = last7Days.findIndex((day) => isSameDay(day.date, wordDate));
            if (dayIndex !== -1) {
                last7Days[dayIndex].count++;
            }
        });

        const maxCount = Math.max(...last7Days.map((d) => d.count), 5); // Min height of 5 for scale

        return {
            days: last7Days,
            maxCount,
        };
    }, [words]);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{t('profile.insights.wordGrowth', 'Word Growth')}</Text>
            <View style={styles.chartArea}>
                {chartData.days.map((day, index) => {
                    const barHeight = chartData.maxCount > 0 ? (day.count / chartData.maxCount) * 100 : 0;
                    const isToday = index === 6;

                    return (
                        <View key={index} style={styles.column}>
                            <View style={styles.barContainer}>
                                <View
                                    style={[
                                        styles.bar,
                                        {
                                            height: `${Math.max(barHeight, 5)}%`, // at least 5% for visibility if count > 0 is handled via color
                                            backgroundColor: day.count > 0
                                                ? (isToday ? theme.colors.primary : theme.colors.primary + '80')
                                                : theme.colors.borderLight
                                        }
                                    ]}
                                />
                                {day.count > 0 && <Text style={styles.countText}>{day.count}</Text>}
                            </View>
                            <Text style={[styles.dayLabel, isToday && styles.todayLabel]}>{day.label}</Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        marginHorizontal: theme.spacing.lg,
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xl,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        marginBottom: theme.spacing.lg,
    },
    title: {
        fontSize: theme.typography.size.lg,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.xl,
    },
    chartArea: {
        height: 120,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.xs,
    },
    column: {
        alignItems: 'center',
        flex: 1,
    },
    barContainer: {
        height: '100%',
        width: '100%',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    bar: {
        width: 12,
        borderRadius: 6,
    },
    countText: {
        position: 'absolute',
        top: -18,
        fontSize: 10,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.primary,
    },
    dayLabel: {
        fontSize: 10,
        color: theme.colors.textSecondary,
    },
    todayLabel: {
        color: theme.colors.primary,
        fontWeight: theme.typography.weight.bold,
    },
}));
