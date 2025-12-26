import React from 'react';
import { View, Pressable, StyleSheet as RNStyleSheet } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Story } from '@/types';
import {
    Typography,
    OptimizedImage,
    RatingStars,
    BookCover
} from '../atoms';

interface FeaturedCardProps {
    story: Story;
    badge?: string;
    onPress?: () => void;
    rating?: number | null;
    reviewCount?: number | null;
}

export const FeaturedCard: React.FC<FeaturedCardProps> = ({
    story,
    badge = "Editor's Choice",
    onPress,
    rating = null,
    reviewCount = null,
}) => {
    const { theme } = useUnistyles();
    const displayRating = rating ?? 0;
    const count = reviewCount ?? 0;
    const coverUri = story.coverImage || 'https://via.placeholder.com/800x400/1a1a2e/ffffff?text=Featured+Story';

    const formatCount = (num: number): string => {
        if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}k`;
        }
        return num.toString();
    };

    return (
        <View style={styles.container}>
            {/* Hero Image */}
            <Pressable onPress={onPress}>
                <View style={styles.heroImage}>
                    <OptimizedImage
                        source={{ uri: coverUri }}
                        placeholder={story.coverImageLqip}
                        style={RNStyleSheet.absoluteFill}
                        sharedTransitionTag={`story-image-${story.id}`}
                    />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0, 0, 0, 0.8)']}
                        style={RNStyleSheet.absoluteFillObject}
                    />
                    {/* Spine Effect Overlay */}
                    <View style={styles.spineLine} />
                    {/* Badge */}
                    <View style={styles.badge}>
                        <Typography variant="label" color={theme.colors.textInverse}>{badge}</Typography>
                    </View>
                    {/* Title on image */}
                    <View style={styles.imageContent}>
                        <Typography variant="h1" color="#FFFFFF">
                            {story.title}
                        </Typography>
                        <Typography variant="subtitle" color="rgba(255, 255, 255, 0.9)">
                            {story.author} • {story.tags[0]}
                        </Typography>
                    </View>
                </View>
            </Pressable>

            {/* Bottom Content */}
            <View style={styles.content}>
                {/* Rating */}
                <View style={styles.ratingRow}>
                    <RatingStars rating={displayRating} size="md" showEmpty />
                    <Typography variant="bodyBold">
                        {displayRating.toFixed(1)}
                    </Typography>
                    <Typography variant="caption" color={theme.colors.textMuted}>
                        ({formatCount(count)} reviews)
                    </Typography>
                </View>

                {/* Description */}
                <Typography variant="body" numberOfLines={3}>
                    {story.description}
                </Typography>

                {/* CTA Button */}
                <Pressable style={styles.button} onPress={onPress}>
                    <Typography variant="button" color={theme.colors.textInverse}>Read Now</Typography>
                    <Ionicons
                        name="arrow-forward"
                        size={theme.iconSize.sm}
                        color={theme.colors.textInverse}
                    />
                </Pressable>
            </View>
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        backgroundColor: theme.colors.surface,
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.md,
    },
    heroImage: {
        height: 240,
        justifyContent: 'flex-end',
    },
    gradient: {
        ...RNStyleSheet.absoluteFillObject,
    },
    badge: {
        position: 'absolute',
        top: theme.spacing.md,
        left: theme.spacing.md,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    imageContent: {
        padding: theme.spacing.lg,
    },
    spineLine: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.15)',
        zIndex: 1,
    },
    content: {
        padding: theme.spacing.lg,
        gap: theme.spacing.md,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        backgroundColor: theme.colors.primary,
        height: 52,
        borderRadius: 12,
        ...theme.shadows.sm,
    },
}));
