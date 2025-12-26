import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { OptimizedImage, BookCover } from '../atoms';
import { Story } from '@/types';

interface BookListItemProps {
    story: Story;
    onPress?: () => void;
    onBookmarkPress?: () => void;
    isBookmarked?: boolean;
    rating?: number | null;
}

export const BookListItem: React.FC<BookListItemProps> = ({
    story,
    onPress,
    onBookmarkPress,
    isBookmarked = false,
    rating = null,
}) => {
    const { theme } = useUnistyles();

    return (
        <Pressable style={styles.container} onPress={onPress}>
            {/* Cover */}
            <BookCover
                source={{ uri: story.coverImage }}
                width={64}
                height={96}
                borderRadius={theme.radius.md}
                sharedTransitionTag={`story-image-${story.id}`}
            />

            {/* Content */}
            <View style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title} numberOfLines={1}>
                            {story.title}
                        </Text>
                        <Text style={styles.author} numberOfLines={1}>
                            {story.author}
                        </Text>
                    </View>
                    <Pressable
                        style={styles.bookmarkButton}
                        onPress={onBookmarkPress}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons
                            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                            size={theme.iconSize.md}
                            color={isBookmarked ? theme.colors.primary : theme.colors.textMuted}
                        />
                    </Pressable>
                </View>

                {/* Tags and Rating */}
                <View style={styles.footer}>
                    <View style={styles.tag}>
                        <Text style={styles.tagText}>{story.tags[0]}</Text>
                    </View>
                    {rating !== null && (
                        <View style={styles.ratingContainer}>
                            <Ionicons
                                name="star"
                                size={12}
                                color={theme.colors.star}
                            />
                            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
                        </View>
                    )}
                </View>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
        gap: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.sm,
    },
    coverContainer: {
        width: 64,
        height: 64,
        borderRadius: theme.radius.md,
        overflow: 'hidden',
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    cover: {
        width: '100%',
        height: '100%',
    },
    content: {
        flex: 1,
        gap: theme.spacing.sm,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    titleContainer: {
        flex: 1,
        gap: theme.spacing.xxs,
    },
    title: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    author: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textMuted,
    },
    bookmarkButton: {
        width: 36,
        height: 36,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    tag: {
        backgroundColor: theme.colors.background,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
        borderRadius: theme.radius.xs + 3, // 5
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    tagText: {
        fontSize: theme.typography.size.xs,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xxs,
    },
    ratingText: {
        fontSize: theme.typography.size.sm,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
}));
