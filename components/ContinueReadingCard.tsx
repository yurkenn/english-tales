import React, { memo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { Story, ReadingProgress } from '@/types';
import { ProgressBar } from './ProgressBar';
import { OptimizedImage } from './OptimizedImage';

interface ContinueReadingCardProps {
    story: Story;
    progress: { percentage: number; isCompleted?: boolean };
    onPress?: () => void;
    onPlayPress?: () => void;
}

export const ContinueReadingCard: React.FC<ContinueReadingCardProps> = memo(({
    story,
    progress,
    onPress,
    onPlayPress,
}) => {
    const { theme } = useUnistyles();
    const totalPages = Math.ceil(story.wordCount / 250); // ~250 words per page
    const currentPage = Math.ceil((progress.percentage / 100) * totalPages);

    return (
        <Pressable style={styles.container} onPress={onPress}>
            {/* Cover */}
            <View style={styles.coverContainer}>
                <OptimizedImage source={{ uri: story.coverImage }} style={styles.cover} />
            </View>

            {/* Content */}
            <View style={styles.content}>
                <Text style={styles.title} numberOfLines={1}>
                    {story.title}
                </Text>
                <Text style={styles.author} numberOfLines={1}>
                    {story.author}
                </Text>

                {/* Progress */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressInfo}>
                        <Text style={styles.progressText}>
                            Page {currentPage} of {totalPages}
                        </Text>
                        <Text style={styles.progressPercent}>{progress.percentage}%</Text>
                    </View>
                    <ProgressBar progress={progress.percentage} />
                </View>
            </View>

            {/* Play Button */}
            <Pressable
                style={styles.playButton}
                onPress={onPlayPress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Ionicons
                    name="play"
                    size={theme.iconSize.md}
                    color={theme.colors.primary}
                />
            </Pressable>
        </Pressable>
    );
});

ContinueReadingCard.displayName = 'ContinueReadingCard';

const styles = StyleSheet.create((theme) => ({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xl,
        padding: theme.spacing.md,
        gap: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.md,
    },
    coverContainer: {
        width: 80,
        height: 112,
        borderRadius: theme.radius.md,
        overflow: 'hidden',
        backgroundColor: theme.colors.borderLight,
        ...theme.shadows.sm,
    },
    cover: {
        width: '100%',
        height: '100%',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        gap: theme.spacing.xs,
    },
    title: {
        fontSize: theme.typography.size.xl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    author: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.sm,
    },
    progressContainer: {
        gap: theme.spacing.xs,
    },
    progressInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    progressText: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textSecondary,
        fontWeight: theme.typography.weight.medium,
    },
    progressPercent: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.primary,
        fontWeight: theme.typography.weight.bold,
    },
    playButton: {
        width: 40,
        height: 40,
        borderRadius: theme.radius.full,
        backgroundColor: `${theme.colors.primary}15`,
        alignItems: 'center',
        justifyContent: 'center',
    },
}));
