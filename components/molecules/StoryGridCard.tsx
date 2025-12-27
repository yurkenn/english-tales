import React, { memo } from 'react';
import { View, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography, BookCover } from '../atoms';
import type { Story } from '@/types';
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS } from './moleculeTypes';
import { useResponsiveGrid } from '@/hooks/useResponsiveGrid';

interface StoryGridCardProps {
    story: Story;
    isInLibrary: boolean;
    onPress: () => void;
}

const StoryGridCardComponent: React.FC<StoryGridCardProps> = ({
    story,
    isInLibrary,
    onPress,
}) => {
    const { theme } = useUnistyles();
    const { cardWidth } = useResponsiveGrid();
    const cardImageHeight = cardWidth * 1.5;

    const difficultyColor = DIFFICULTY_COLORS[story.difficulty] || theme.colors.textMuted;
    const difficultyLabel = DIFFICULTY_LABELS[story.difficulty] || story.difficulty;

    return (
        <Pressable
            style={({ pressed }) => [
                styles.card,
                { width: cardWidth },
                pressed && styles.cardPressed,
            ]}
            onPress={onPress}
        >
            <View style={[styles.coverContainer, { width: cardWidth, height: cardImageHeight }]}>
                <BookCover
                    source={{ uri: story.coverImage || '' }}
                    placeholder={story.coverImageLqip}
                    width={cardWidth}
                    height={cardImageHeight}
                    sharedTransitionTag={`story-image-${story.id}`}
                    showPages={true}
                    borderRadius={theme.radius.md}
                />

                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.85)']}
                    style={styles.gradient}
                />

                <View style={styles.topBadges}>
                    <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor }]}>
                        <Typography variant="label" color="#FFFFFF" style={styles.difficultyText}>
                            {difficultyLabel}
                        </Typography>
                    </View>
                    {story.isPremiumOnly && (
                        <View style={styles.premiumBadge}>
                            <Ionicons name="star" size={12} color="#FFFFFF" />
                            <Typography variant="label" color="#FFFFFF" style={styles.premiumText}>
                                PRO
                            </Typography>
                        </View>
                    )}
                    {isInLibrary && (
                        <View style={styles.libraryBadge}>
                            <Ionicons name="bookmark" size={12} color="#FFFFFF" />
                        </View>
                    )}
                </View>

                <View style={styles.overlayInfo}>
                    <Typography variant="subtitle" color="#FFFFFF" numberOfLines={2} style={styles.overlayTitle}>
                        {story.title}
                    </Typography>
                    <View style={styles.overlayMeta}>
                        <Typography variant="caption" color="rgba(255,255,255,0.8)" numberOfLines={1} style={styles.overlayAuthor}>
                            {story.author}
                        </Typography>
                        <View style={styles.readTimeBadge}>
                            <Ionicons name="time-outline" size={10} color="rgba(255,255,255,0.8)" />
                            <Typography variant="label" color="rgba(255,255,255,0.9)" style={styles.readTimeText}>
                                {story.estimatedReadTime}m
                            </Typography>
                        </View>
                    </View>
                </View>
            </View>
        </Pressable>
    );
};

// Memoize component to prevent unnecessary re-renders in grid lists
export const StoryGridCard = memo(StoryGridCardComponent, (prevProps, nextProps) => {
    return prevProps.story.id === nextProps.story.id
        && prevProps.isInLibrary === nextProps.isInLibrary;
});

const styles = StyleSheet.create((theme) => ({
    card: {
        marginBottom: theme.spacing.md,
    },
    cardPressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }],
    },
    coverContainer: {
        position: 'relative',
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '65%',
        borderBottomLeftRadius: theme.radius.lg,
        borderBottomRightRadius: theme.radius.lg,
    },
    topBadges: {
        position: 'absolute',
        top: theme.spacing.sm,
        left: theme.spacing.sm,
        right: theme.spacing.sm,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10,
    },
    difficultyBadge: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
        borderRadius: theme.radius.full,
    },
    difficultyText: {
        fontSize: theme.typography.size.xs,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    libraryBadge: {
        width: 24,
        height: 24,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.sm,
    },
    premiumBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        backgroundColor: theme.colors.warning,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
        borderRadius: theme.radius.full,
    },
    premiumText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    overlayInfo: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: theme.spacing.sm,
        paddingBottom: theme.spacing.md,
        zIndex: 5,
    },
    overlayTitle: {
        fontSize: theme.typography.size.md,
        fontWeight: '700',
        lineHeight: 18,
    },
    overlayMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: theme.spacing.xxs,
    },
    overlayAuthor: {
        flex: 1,
        fontSize: theme.typography.size.xs,
    },
    readTimeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xxs,
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: theme.spacing.xs + 2, // 6
        paddingVertical: 1,
        borderRadius: theme.radius.full,
    },
    readTimeText: {
        fontSize: theme.typography.size.xs,
        fontWeight: '600',
    },
}));
