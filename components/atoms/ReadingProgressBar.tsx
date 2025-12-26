import React from 'react';
import { View, Text } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar } from './ProgressBar';
import { useTranslation } from 'react-i18next';

/**
 * Props for the ReadingProgressBar component
 */
interface ReadingProgressBarProps {
    /** Progress percentage (0-100) */
    progress: number;
    /** Total estimated reading time for the story in minutes */
    estimatedReadTime: number;
    /** Current page number (1-indexed) */
    currentPage?: number;
    /** Total number of pages */
    totalPages?: number;
}

/**
 * Progress bar component for the reading screen.
 * Visualizes reading progress and displays remaining time.
 */
export const ReadingProgressBar: React.FC<ReadingProgressBarProps> = React.memo(({
    progress,
    estimatedReadTime,
    currentPage,
    totalPages,
}) => {
    const { t } = useTranslation();
    const { theme } = useUnistyles();
    const remainingTime = Math.max(1, Math.ceil(estimatedReadTime * (100 - progress) / 100));

    // Show page info if available, otherwise show percentage
    const showPageInfo = currentPage !== undefined && totalPages !== undefined && totalPages > 0;

    return (
        <View style={styles.container}>
            <ProgressBar
                progress={progress}
                height={3}
                trackColor={theme.colors.borderLight}
            />
            <View style={styles.info}>
                <View style={styles.timeBadge}>
                    <Ionicons name="time-outline" size={12} color={theme.colors.textMuted} />
                    <Text style={styles.remainingText}>
                        {t('reading.remainingTime', { time: remainingTime })}
                    </Text>
                </View>
                {showPageInfo ? (
                    <Text style={styles.percentageText}>
                        {t('reading.pageOfShifted', { current: currentPage + 1, total: totalPages })}
                        {totalPages - (currentPage + 1) > 0 && ` · ${t('reading.pagesLeftCount', { count: totalPages - (currentPage + 1) })}`}
                    </Text>
                ) : (
                    <Text style={styles.percentageText}>{Math.round(progress)}%</Text>
                )}
            </View>
        </View>
    );
});

const styles = StyleSheet.create((theme) => ({
    container: {
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: 10,
        gap: 8,
        backgroundColor: theme.colors.background,
    },
    info: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 2,
    },
    timeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    remainingText: {
        fontSize: theme.typography.size.xs,
        fontFamily: theme.typography.fontFamily.semiBold,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        color: theme.colors.textMuted,
    },
    percentageText: {
        fontSize: theme.typography.size.xs,
        fontFamily: theme.typography.fontFamily.semiBold,
        color: theme.colors.textMuted,
    },
}));
