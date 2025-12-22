import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import type { Story } from '@/types';

interface PopularStoryCardProps {
    story: Story;
    rank: number;
    onPress: () => void;
}

export const PopularStoryCard: React.FC<PopularStoryCardProps> = ({
    story,
    rank,
    onPress,
}) => {
    const { theme } = useUnistyles();

    const renderRankBadge = () => {
        const isTop3 = rank <= 3;
        let iconName: keyof typeof Ionicons.glyphMap | null = null;
        let badgeStyle = styles.rankBadge;

        if (rank === 1) {
            iconName = 'medal';
            badgeStyle = [styles.rankBadge, styles.rankBadgeGold];
        } else if (rank === 2) {
            iconName = 'medal';
            badgeStyle = [styles.rankBadge, styles.rankBadgeSilver];
        } else if (rank === 3) {
            iconName = 'medal';
            badgeStyle = [styles.rankBadge, styles.rankBadgeBronze];
        }

        return (
            <View style={badgeStyle}>
                {iconName ? (
                    <Ionicons name={iconName} size={14} color="#FFF" style={styles.medalIcon} />
                ) : null}
                <Text style={[styles.rankText, isTop3 && styles.rankTextWhite]}>{rank}</Text>
            </View>
        );
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
            {renderRankBadge()}

            <View style={styles.info}>
                <Text style={styles.title} numberOfLines={1}>
                    {story.title}
                </Text>
                <Text style={styles.author} numberOfLines={1}>
                    {story.author}
                </Text>
            </View>

            <View style={styles.meta}>
                <View style={[styles.difficultyBadge, getDifficultyStyle()]}>
                    <Text style={styles.difficultyText}>{getDifficultyLabel()}</Text>
                </View>
                <View style={styles.readTimeBadge}>
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
    rankBadge: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: theme.colors.surfaceElevated,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        position: 'relative',
    },
    rankBadgeGold: {
        backgroundColor: '#FFD700',
        borderColor: '#FFC107',
        ...theme.shadows.sm,
    },
    rankBadgeSilver: {
        backgroundColor: '#C0C0C0',
        borderColor: '#9E9E9E',
        ...theme.shadows.sm,
    },
    rankBadgeBronze: {
        backgroundColor: '#CD7F32',
        borderColor: '#A0522D',
        ...theme.shadows.sm,
    },
    medalIcon: {
        position: 'absolute',
        top: -4,
        right: -4,
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    rankText: {
        fontSize: theme.typography.size.md,
        fontWeight: '800',
        color: theme.colors.textSecondary,
    },
    rankTextWhite: {
        color: '#FFFFFF',
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
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
    difficultyBadge: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
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
        fontSize: theme.typography.size.xs,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
        textTransform: 'uppercase',
    },
    readTimeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    readTimeText: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.textMuted,
    },
}));
