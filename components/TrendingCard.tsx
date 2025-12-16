import React, { memo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { OptimizedImage } from './OptimizedImage';
import { Story } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';
import { haptics } from '@/utils/haptics';

interface TrendingCardProps {
    story: Story;
    onPress?: () => void;
    onBookmarkPress?: () => void;
    isBookmarked?: boolean;
    index?: number;
}

export const TrendingCard: React.FC<TrendingCardProps> = memo(({
    story,
    onPress,
    onBookmarkPress,
    isBookmarked = false,
    index,
}) => {
    const { theme } = useUnistyles();
    const coverUri = story.coverImage || 'https://via.placeholder.com/300x200/1a1a2e/ffffff?text=No+Cover';

    const handlePress = () => {
        haptics.selection();
        onPress?.();
    };

    const handleBookmark = (e: any) => {
        e.stopPropagation();
        haptics.selection();
        onBookmarkPress?.();
    };

    return (
        <Pressable 
            style={({ pressed }) => [
                styles.container,
                pressed && styles.pressed
            ]}
            onPress={handlePress}
            accessibilityRole="button"
            accessibilityLabel={`${story.title} by ${story.author}`}
            accessibilityHint="Double tap to open story"
        >
            {/* Cover Image with Gradient Overlay */}
            <View style={styles.coverContainer}>
                <OptimizedImage source={{ uri: coverUri }} style={styles.cover} />
                {/* Minimal Gradient - Only for badge readability */}
                <LinearGradient
                    colors={['rgba(0,0,0,0.3)', 'transparent']}
                    style={styles.topGradient}
                />
                
                {/* Top Badges - Spotify Style */}
                <View style={styles.topBadgesRow}>
                    {/* Trending Badge - Small and Subtle */}
                    <View style={styles.trendingBadge}>
                        <Ionicons name="flame" size={10} color={theme.colors.textInverse} />
                        <Text style={styles.trendingText}>TRENDING</Text>
                    </View>

                    {/* Bookmark Button */}
                    {onBookmarkPress && (
                        <Pressable
                            style={({ pressed }) => [
                                styles.bookmarkButton,
                                pressed && styles.bookmarkButtonPressed
                            ]}
                            onPress={handleBookmark}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            accessibilityRole="button"
                            accessibilityLabel={isBookmarked ? 'Remove from library' : 'Add to library'}
                            accessibilityHint="Double tap to bookmark or remove from library"
                        >
                            <Ionicons
                                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                                size={theme.iconSize.sm}
                                color={theme.colors.textInverse}
                            />
                        </Pressable>
                    )}
                </View>

                {/* Play Button Overlay - Spotify Style (Floating on image) */}
                <View style={styles.playButtonOverlay}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.playButton,
                            pressed && styles.playButtonPressed
                        ]}
                        onPress={handlePress}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityRole="button"
                        accessibilityLabel="Read story"
                    >
                        <Ionicons name="play" size={24} color={theme.colors.textInverse} />
                    </Pressable>
                </View>
            </View>

            {/* Content Below Image - Spotify Style */}
            <View style={styles.content}>
                <Text style={styles.title} numberOfLines={1}>
                    {story.title}
                </Text>
                <Text style={styles.author} numberOfLines={1}>
                    {story.author}
                </Text>
                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={12} color={theme.colors.textMuted} />
                        <Text style={styles.metaText}>{story.estimatedReadTime} min</Text>
                    </View>
                    {story.tags[0] && (
                        <View style={styles.tag}>
                            <Text style={styles.tagText}>{story.tags[0]}</Text>
                        </View>
                    )}
                </View>
            </View>
        </Pressable>
    );
});

TrendingCard.displayName = 'TrendingCard';

const styles = StyleSheet.create((theme) => ({
    container: {
        width: 260,
        borderRadius: theme.radius.lg,
        overflow: 'hidden',
        backgroundColor: theme.colors.surface,
        ...theme.shadows.md,
    },
    pressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }],
    },
    coverContainer: {
        width: '100%',
        height: 260, // Square-ish aspect ratio (Spotify style)
        position: 'relative',
    },
    cover: {
        width: '100%',
        height: '100%',
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
    },
    topGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 60,
    },
    topBadgesRow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.sm,
    },
    trendingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xxs,
        backgroundColor: 'rgba(255, 87, 34, 0.9)',
        paddingHorizontal: theme.spacing.xs,
        paddingVertical: 2,
        borderRadius: theme.radius.full,
    },
    trendingText: {
        fontSize: theme.typography.size.xxs,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.textInverse,
        letterSpacing: 0.3,
    },
    bookmarkButton: {
        width: 32,
        height: 32,
        borderRadius: theme.radius.full,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bookmarkButtonPressed: {
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        transform: [{ scale: 0.95 }],
    },
    playButtonOverlay: {
        position: 'absolute',
        bottom: theme.spacing.sm,
        right: theme.spacing.sm,
    },
    playButton: {
        width: 48,
        height: 48,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.lg,
    },
    playButtonPressed: {
        backgroundColor: theme.colors.primaryDark,
        transform: [{ scale: 0.95 }],
    },
    content: {
        padding: theme.spacing.md,
        gap: theme.spacing.xs,
    },
    title: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
        lineHeight: theme.typography.size.md * 1.2,
    },
    author: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textSecondary,
        lineHeight: theme.typography.size.sm * 1.2,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        marginTop: theme.spacing.xxs,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xxs,
    },
    metaText: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.textMuted,
    },
    tag: {
        backgroundColor: theme.colors.backgroundSecondary,
        paddingHorizontal: theme.spacing.xs,
        paddingVertical: 2,
        borderRadius: theme.radius.xs,
    },
    tagText: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.textSecondary,
        fontWeight: theme.typography.weight.medium,
    },
}));

