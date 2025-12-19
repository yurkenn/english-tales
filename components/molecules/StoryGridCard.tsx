import React from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { OptimizedImage } from '../atoms';
import type { Story } from '@/types';
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS } from './moleculeTypes';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12;
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
                <OptimizedImage
                    source={{ uri: story.coverImage || 'https://via.placeholder.com/200x300' }}
                    placeholder={story.coverImageLqip}
                    style={styles.coverImage}
                    sharedTransitionTag={`story-image-${story.id}`}
                    width={CARD_WIDTH}
                    height={CARD_IMAGE_HEIGHT}
                />

                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.gradient}
                />

                <View style={styles.topBadges}>
                    <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor }]}>
                        <Text style={styles.difficultyText}>{difficultyLabel}</Text>
                    </View>
                    {isInLibrary && (
                        <View style={styles.libraryBadge}>
                            <Ionicons name="bookmark" size={12} color="#FFFFFF" />
                        </View>
                    )}
                </View>

                <View style={styles.overlayInfo}>
                    <Text style={styles.overlayTitle} numberOfLines={2}>
                        {story.title}
                    </Text>
                    <View style={styles.overlayMeta}>
                        <Text style={styles.overlayAuthor} numberOfLines={1}>
                            {story.author}
                        </Text>
                        <View style={styles.readTimeBadge}>
                            <Ionicons name="time-outline" size={10} color="rgba(255,255,255,0.8)" />
                            <Text style={styles.readTimeText}>{story.estimatedReadTime}m</Text>
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
        borderRadius: theme.radius.xl,
        overflow: 'hidden',
        ...theme.shadows.md,
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
    coverImage: {
        width: '100%',
        height: '100%',
        backgroundColor: theme.colors.borderLight,
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '60%',
    },
    topBadges: {
        position: 'absolute',
        top: 8,
        left: 8,
        right: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    difficultyBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: theme.radius.full,
    },
    difficultyText: {
        fontSize: 10,
        fontWeight: theme.typography.weight.bold,
        color: '#FFFFFF',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    libraryBadge: {
        width: 26,
        height: 26,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    overlayInfo: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: theme.spacing.sm,
    },
    overlayTitle: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.bold,
        color: '#FFFFFF',
        lineHeight: 20,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    overlayMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    overlayAuthor: {
        flex: 1,
        fontSize: theme.typography.size.sm,
        color: 'rgba(255,255,255,0.85)',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    readTimeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: 'rgba(0,0,0,0.4)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: theme.radius.full,
    },
    readTimeText: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: theme.typography.weight.medium,
    },
}));
