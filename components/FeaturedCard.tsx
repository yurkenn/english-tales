import React from 'react';
import { View, Text, ImageBackground, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Story } from '@/types';
import { RatingStars } from './RatingStars';

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
            <ImageBackground
                source={{ uri: coverUri }}
                style={styles.imageContainer}
                resizeMode="cover"
            >
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
                    style={styles.gradient}
                />
                {/* Badge */}
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badge}</Text>
                </View>
                {/* Title on image */}
                <View style={styles.imageContent}>
                    <Text style={styles.heroTitle}>{story.title}</Text>
                    <Text style={styles.heroSubtitle}>
                        {story.author} • {story.tags[0]}
                    </Text>
                </View>
            </ImageBackground>

            {/* Content */}
            <View style={styles.content}>
                {/* Rating */}
                <View style={styles.ratingRow}>
                    <RatingStars rating={displayRating} size="md" showEmpty />
                    <Text style={styles.ratingValue}>{displayRating.toFixed(1)}</Text>
                    <Text style={styles.ratingCount}>({formatCount(count)} reviews)</Text>
                </View>

                {/* Description */}
                <Text style={styles.description} numberOfLines={3}>
                    {story.description}
                </Text>

                {/* CTA Button */}
                <Pressable style={styles.button} onPress={onPress}>
                    <Text style={styles.buttonText}>Read Now</Text>
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
    imageContainer: {
        height: 220,
        justifyContent: 'flex-end',
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
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
        fontSize: theme.typography.size.xs,
        fontWeight: theme.typography.weight.bold,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    imageContent: {
        padding: theme.spacing.lg,
    },
    heroTitle: {
        fontSize: theme.typography.size.xxxl,
        fontWeight: theme.typography.weight.bold,
        color: '#FFFFFF',
        marginBottom: theme.spacing.xs,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    heroSubtitle: {
        fontSize: theme.typography.size.md,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: theme.typography.weight.medium,
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
    ratingValue: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    ratingCount: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textMuted,
    },
    description: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
        lineHeight: 22,
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
        fontSize: theme.typography.size.lg,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.textInverse,
    },
}));
