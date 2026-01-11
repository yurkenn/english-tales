import React, { memo } from 'react';
import { View, Pressable , StyleSheet } from 'react-native';
import { useTheme, Theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { Typography, BookCover } from '../atoms';
import { Story } from '@/types';

interface BookCardProps {
    story: Story;
    onPress?: () => void;
    showRank?: number;
    rating?: number | null;
    priority?: 'low' | 'normal' | 'high';
}

const BookCardComponent: React.FC<BookCardProps> = ({
    story,
    onPress,
    showRank,
    rating = null,
    priority,
}) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const coverUri = story.coverImage || 'https://via.placeholder.com/240x336/1a1a2e/ffffff?text=No+Cover';

    return (
        <Pressable
            style={styles.container}
            onPress={onPress}
            accessible
            accessibilityRole="button"
            accessibilityLabel={`${story.title} by ${story.author}${story.isPremiumOnly ? ', Premium content' : ''}`}
        >
            {/* Cover Image with Page Stack Effect */}
            <BookCover
                source={{ uri: coverUri }}
                placeholder={story.coverImageLqip}
                width={theme.bookCover.width}
                sharedTransitionTag={`story-image-${story.id}`}
                showPages={true}
                borderRadius={10}
                priority={priority}
            />

            {/* Rank Badge overlay on top of BookCover */}
            {showRank && (
                <View style={styles.rankBadge}>
                    <Typography variant="label" color={theme.colors.textInverse}>#{showRank}</Typography>
                </View>
            )}

            {/* Rating Badge overlay on top of BookCover */}
            {rating !== null && (
                <View style={styles.ratingBadge}>
                    <Ionicons
                        name="star"
                        size={10}
                        color={theme.colors.star}
                    />
                    <Typography variant="label" color="#FFFFFF">{rating.toFixed(1)}</Typography>
                </View>
            )}

            {/* Premium Badge */}
            {story.isPremiumOnly && (
                <View style={styles.premiumBadge}>
                    <Ionicons name="star" size={10} color="#FFFFFF" />
                    <Typography variant="label" color="#FFFFFF" style={styles.premiumText}>PRO</Typography>
                </View>
            )}

            {/* Info */}
            <View style={styles.info}>
                <Typography variant="subtitle" numberOfLines={1} style={styles.title}>
                    {story.title}
                </Typography>
                <Typography variant="caption" color={theme.colors.textMuted} numberOfLines={1}>
                    {story.author}
                </Typography>
            </View>
        </Pressable>
    );
};

// Memoize component to prevent unnecessary re-renders in lists
export const BookCard = memo(BookCardComponent, (prevProps, nextProps) => {
    return prevProps.story.id === nextProps.story.id
        && prevProps.showRank === nextProps.showRank
        && prevProps.rating === nextProps.rating
        && prevProps.priority === nextProps.priority;
});

const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        width: theme.bookCover.width,
        gap: theme.spacing.xs,
        marginBottom: theme.spacing.sm,
    },
    rankBadge: {
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundColor: theme.colors.primary,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderTopLeftRadius: theme.radius.lg,
        borderBottomRightRadius: theme.radius.lg,
        zIndex: 10,
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
        zIndex: 10,
    },
    info: {
        gap: 0,
    },
    title: {
        marginTop: 0,
    },
    premiumBadge: {
        position: 'absolute',
        bottom: 50,
        right: theme.spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        backgroundColor: theme.colors.warning,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
        borderRadius: theme.radius.full,
        zIndex: 10,
    },
    premiumText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
});
