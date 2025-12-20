import React from 'react';
import { View, Pressable, Dimensions } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography, BookCover } from '../atoms';
import type { Story } from '@/types';
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS } from './moleculeTypes';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 16; // Increased from 12 for better breathing room
const HORIZONTAL_PADDING = 16;
export const CARD_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - CARD_GAP) / 2;
export const CARD_IMAGE_HEIGHT = CARD_WIDTH * 1.5;

interface StoryGridCardProps {
    story: Story;
    isInLibrary: boolean;
    onPress: () => void;
}

export const StoryGridCard: React.FC<StoryGridCardProps> = ({
    story,
    isInLibrary,
    onPress,
}) => {
    const { theme } = useUnistyles();
    const difficultyColor = DIFFICULTY_COLORS[story.difficulty] || theme.colors.textMuted;
    const difficultyLabel = DIFFICULTY_LABELS[story.difficulty] || story.difficulty;

    return (
        <Pressable
            style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
            ]}
            onPress={onPress}
        >
            <View style={styles.coverContainer}>
                <BookCover
                    source={{ uri: story.coverImage || '' }}
                    placeholder={story.coverImageLqip}
                    width={CARD_WIDTH}
                    height={CARD_IMAGE_HEIGHT}
                    sharedTransitionTag={`story-image-${story.id}`}
                    showPages={true}
                    borderRadius={10}
                />

                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.85)']} // Refined gradient
                    style={styles.gradient}
                />

                <View style={styles.topBadges}>
                    <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor }]}>
                        <Typography variant="label" color="#FFFFFF" style={styles.difficultyText}>
                            {difficultyLabel}
                        </Typography>
                    </View>
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

const styles = StyleSheet.create((theme) => ({
    card: {
        width: CARD_WIDTH,
        marginBottom: theme.spacing.md,
    },
    cardPressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }],
    },
    coverContainer: {
        position: 'relative',
        width: CARD_WIDTH,
        height: CARD_IMAGE_HEIGHT,
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '65%',
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
    },
    topBadges: {
        position: 'absolute',
        top: 8,
        left: 8,
        right: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10,
    },
    difficultyBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: theme.radius.full,
    },
    difficultyText: {
        fontSize: 9,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    libraryBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.sm,
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
        fontSize: 14,
        fontWeight: '700',
        lineHeight: 18,
    },
    overlayMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 2,
    },
    overlayAuthor: {
        flex: 1,
        fontSize: 11,
    },
    readTimeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: theme.radius.full,
    },
    readTimeText: {
        fontSize: 9,
        fontWeight: '600',
    },
}));
