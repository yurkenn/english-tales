import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import type { Story } from '@/types';

interface TrendingStoryCardProps {
    story: Story;
    rank: number;
    onPress: () => void;
}

export const TrendingStoryCard: React.FC<TrendingStoryCardProps> = ({
    story,
    rank,
    onPress,
}) => {
    const { theme } = useUnistyles();

    const getRankStyle = () => {
        if (rank === 1) return styles.rankGold;
        if (rank === 2) return styles.rankSilver;
        if (rank === 3) return styles.rankBronze;
        return null;
    };

    const getDifficultyLabel = () => {
        if (story.difficulty === 'beginner') return 'Easy';
        if (story.difficulty === 'intermediate') return 'Medium';
        return 'Hard';
    };

    const getDifficultyStyle = () => {
        if (story.difficulty === 'beginner') return styles.difficultyEasy;
        if (story.difficulty === 'intermediate') return styles.difficultyMedium;
        return styles.difficultyHard;
    };

    return (
        <Pressable
            style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
            ]}
            onPress={onPress}
        >
            <View style={[styles.rank, getRankStyle()]}>
                <Text style={styles.rankText}>{rank}</Text>
            </View>

            <View style={styles.info}>
                <Text style={styles.title} numberOfLines={1}>
                    {story.title}
                </Text>
                <Text style={styles.author} numberOfLines={1}>
                    {story.author}
                </Text>
            </View>

            <View style={styles.meta}>
                <View style={[styles.difficulty, getDifficultyStyle()]}>
                    <Text style={styles.difficultyText}>{getDifficultyLabel()}</Text>
                </View>
                <View style={styles.readTime}>
                    <Ionicons name="time-outline" size={12} color={theme.colors.textMuted} />
                    <Text style={styles.readTimeText}>{story.estimatedReadTime}m</Text>
                </View>
            </View>

            <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.textMuted}
            />
        </Pressable>
    );
};

const styles = StyleSheet.create((theme) => ({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xl,
        padding: theme.spacing.md,
        gap: theme.spacing.md,
        ...theme.shadows.sm,
    },
    cardPressed: {
        backgroundColor: theme.colors.surfaceElevated,
        transform: [{ scale: 0.99 }],
    },
    rank: {
        width: 32,
        height: 32,
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.backgroundSecondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rankGold: {
        backgroundColor: '#FCD34D',
    },
    rankSilver: {
        backgroundColor: '#D1D5DB',
    },
    rankBronze: {
        backgroundColor: '#FBBF24',
    },
    rankText: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    info: {
        flex: 1,
        gap: 2,
    },
    title: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.text,
    },
    author: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textSecondary,
    },
    meta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
    },
    difficulty: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 3,
        borderRadius: theme.radius.full,
    },
    difficultyEasy: {
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
    },
    difficultyMedium: {
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
    },
    difficultyHard: {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
    },
    difficultyText: {
        fontSize: 10,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
        textTransform: 'uppercase',
    },
    readTime: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    readTimeText: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.textMuted,
    },
}));
