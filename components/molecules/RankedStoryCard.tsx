import React, { memo, useMemo } from 'react';
import { View, Text, Pressable, StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import type { Story } from '@/types';

interface RankedStoryCardProps {
    story: Story;
    rank: number;
    onPress: () => void;
    style?: StyleProp<ViewStyle>;
}

/**
 * Unified component for displaying ranked stories
 * Replaces PopularStoryCard and TrendingStoryCard
 */
const RankedStoryCardComponent: React.FC<RankedStoryCardProps> = ({
    story,
    rank,
    onPress,
    style,
}) => {
    const { theme } = useUnistyles();

    const rankConfig = useMemo(() => {
        const isTop3 = rank <= 3;
        const configs: Record<number, { color: string; borderColor: string }> = {
            1: { color: '#FFD700', borderColor: '#FFC107' },
            2: { color: '#C0C0C0', borderColor: '#9E9E9E' },
            3: { color: '#CD7F32', borderColor: '#A0522D' },
        };
        return { isTop3, ...configs[rank] };
    }, [rank]);

    const difficultyConfig = useMemo(() => {
        const configs: Record<string, { label: string; bgColor: string }> = {
            beginner: { label: 'Easy', bgColor: 'rgba(16, 185, 129, 0.15)' },
            intermediate: { label: 'Medium', bgColor: 'rgba(245, 158, 11, 0.15)' },
            advanced: { label: 'Hard', bgColor: 'rgba(239, 68, 68, 0.15)' },
        };
        return configs[story.difficulty] || configs.beginner;
    }, [story.difficulty]);

    const rankBadgeStyle = useMemo(() => {
        if (!rankConfig.color) return {};
        return {
            backgroundColor: rankConfig.color,
            borderColor: rankConfig.borderColor,
            ...theme.shadows.sm,
        };
    }, [rankConfig, theme.shadows.sm]);

    return (
        <Pressable
            style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
                style,
            ]}
            onPress={onPress}
        >
            {/* Rank Badge */}
            <View style={[styles.rankBadge, rankBadgeStyle]}>
                {rankConfig.isTop3 && (
                    <Ionicons
                        name="medal"
                        size={14}
                        color="#FFF"
                        style={styles.medalIcon}
                    />
                )}
                <Text style={[
                    styles.rankText,
                    rankConfig.isTop3 && styles.rankTextWhite
                ]}>
                    {rank}
                </Text>
            </View>

            {/* Story Info */}
            <View style={styles.info}>
                <Text style={styles.title} numberOfLines={1}>
                    {story.title}
                </Text>
                <Text style={styles.author} numberOfLines={1}>
                    {story.author}
                </Text>
            </View>

            {/* Meta */}
            <View style={styles.meta}>
                <View style={[
                    styles.difficultyBadge,
                    { backgroundColor: difficultyConfig.bgColor }
                ]}>
                    <Text style={styles.difficultyText}>
                        {difficultyConfig.label}
                    </Text>
                </View>
                <View style={styles.readTimeBadge}>
                    <Ionicons
                        name="time-outline"
                        size={12}
                        color={theme.colors.textMuted}
                    />
                    <Text style={styles.readTimeText}>
                        {story.estimatedReadTime}m
                    </Text>
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

// Memoize with custom comparison
export const RankedStoryCard = memo(RankedStoryCardComponent, (prev, next) => {
    return prev.story.id === next.story.id && prev.rank === next.rank;
});

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
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surfaceElevated,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        position: 'relative',
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
        gap: theme.spacing.xxs,
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
    difficultyText: {
        fontSize: theme.typography.size.xs,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
        textTransform: 'uppercase',
    },
    readTimeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xxs,
    },
    readTimeText: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.textMuted,
    },
}));
