import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { Story } from '@/types';
import { getStoryRating } from '@/data/mock';

interface BookCardProps {
    story: Story;
    onPress?: () => void;
    showRank?: number;
}

export const BookCard: React.FC<BookCardProps> = ({
    story,
    onPress,
    showRank,
}) => {
    const { theme } = useUnistyles();
    const { rating } = getStoryRating(story.id);

    return (
        <Pressable style={styles.container} onPress={onPress}>
            {/* Cover Image */}
            <View style={styles.coverContainer}>
                <Image source={{ uri: story.coverImage }} style={styles.cover} />
                {/* Rank Badge */}
                {showRank && (
                    <View style={styles.rankBadge}>
                        <Text style={styles.rankText}>#{showRank}</Text>
                    </View>
                )}
                {/* Rating Badge */}
                <View style={styles.ratingBadge}>
                    <Ionicons
                        name="star"
                        size={10}
                        color={theme.colors.star}
                    />
                    <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
                </View>
            </View>
            {/* Info */}
            <View style={styles.info}>
                <Text style={styles.title} numberOfLines={1}>
                    {story.title}
                </Text>
                <Text style={styles.author} numberOfLines={1}>
                    {story.author}
                </Text>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        width: theme.bookCover.width,
        gap: theme.spacing.sm,
    },
    coverContainer: {
        width: '100%',
        aspectRatio: theme.bookCover.aspectRatio,
        borderRadius: theme.radius.lg,
        overflow: 'hidden',
        backgroundColor: theme.colors.borderLight,
        ...theme.shadows.md,
    },
    cover: {
        width: '100%',
        height: '100%',
    },
    rankBadge: {
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundColor: theme.colors.primary,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderBottomRightRadius: theme.radius.lg,
    },
    rankText: {
        color: theme.colors.textInverse,
        fontSize: theme.typography.size.xs,
        fontWeight: theme.typography.weight.bold,
    },
    ratingBadge: {
        position: 'absolute',
        top: theme.spacing.sm,
        right: theme.spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: theme.spacing.xs,
        paddingVertical: 2,
        borderRadius: theme.radius.xs,
    },
    ratingText: {
        color: theme.colors.textInverse,
        fontSize: theme.typography.size.xs,
        fontWeight: theme.typography.weight.bold,
    },
    info: {
        gap: 2,
    },
    title: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    author: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textSecondary,
    },
}));
