import React from 'react';
import { View, Text } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { ProgressBar } from '@/components';

interface ReadingProgressBarProps {
    progress: number;
    estimatedReadTime: number;
}

export const ReadingProgressBar: React.FC<ReadingProgressBarProps> = ({
    progress,
    estimatedReadTime,
}) => {
    const remainingTime = Math.max(1, Math.ceil(estimatedReadTime * (100 - progress) / 100));

    return (
        <View style={styles.container}>
            <ProgressBar progress={progress} height={4} />
            <View style={styles.info}>
                <Text style={styles.progressText}>{progress}% complete</Text>
                <Text style={styles.remainingText}>~{remainingTime} min left</Text>
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
