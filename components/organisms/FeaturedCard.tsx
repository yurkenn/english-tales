import React from 'react';
import { View, Pressable, StyleSheet as RNStyleSheet } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Story } from '@/types';
import {
    Typography,
    OptimizedImage,
    RatingStars
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
                        height={220}
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0, 0, 0, 0.8)']}
                        style={RNStyleSheet.absoluteFillObject}
                    />
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
        borderRadius: theme.radius.xxl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.lg,
    },
    heroImage: {
        height: 220,
        justifyContent: 'flex-end',
    },
    gradient: {
        ...RNStyleSheet.absoluteFillObject,
    },
    badge: {
        position: 'absolute',
        top: theme.spacing.lg,
        left: theme.spacing.lg,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.radius.full,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    badgeText: {
        color: theme.colors.textInverse,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    imageContent: {
        padding: theme.spacing.lg,
    },
    content: {
        padding: theme.spacing.xl,
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
        height: 48,
        borderRadius: theme.radius.lg,
        ...theme.shadows.md,
    },
    buttonText: {
        color: theme.colors.textInverse,
    },
}));
