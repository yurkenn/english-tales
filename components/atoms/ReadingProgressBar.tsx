import React from 'react';
import { View, Text } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
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
}

/**
 * Progress bar component for the reading screen.
 * Visualizes reading progress and displays remaining time.
 */
export const ReadingProgressBar: React.FC<ReadingProgressBarProps> = ({
    progress,
    estimatedReadTime,
}) => {
    const { t } = useTranslation();
    const remainingTime = Math.max(1, Math.ceil(estimatedReadTime * (100 - progress) / 100));
    return (
        <View style={styles.container}>
            <ProgressBar progress={progress} height={4} />
            <View style={styles.info}>
                <Text style={styles.progressText}>{t('reading.complete', { percentage: progress })}</Text>
                <Text style={styles.remainingText}>{t('reading.remainingTime', { time: remainingTime })}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
        gap: theme.spacing.xs,
    },
    info: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    progressText: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.textMuted,
    },
    remainingText: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.textSecondary,
    },
}));
