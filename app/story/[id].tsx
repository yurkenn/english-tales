import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Image, ImageBackground, ActivityIndicator } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RatingStars } from '@/components';
import { useStory, useStoryRating, useReviewsByStory } from '@/hooks/useQueries';
import { urlFor } from '@/services/sanity/client';
import { Story } from '@/types';
import { useLibraryStore } from '@/store/libraryStore';

export default function StoryDetailScreen() {
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams<{ id: string }>();

    // Fetch data
    const { data: storyDoc, isLoading: loadingStory } = useStory(id || '');
    const { data: ratingData, isLoading: loadingRating } = useStoryRating(id || '');
    const { data: reviewsData, isLoading: loadingReviews } = useReviewsByStory(id || '');

    // Transform Story
    const story: Story | null = useMemo(() => {
        if (!storyDoc) return null;
        return {
            id: storyDoc._id,
            title: storyDoc.title,
            description: storyDoc.description,
            content: storyDoc.content || '',
            coverImage: storyDoc.coverImage ? urlFor(storyDoc.coverImage).width(800).url() : '',
            author: storyDoc.author?.name || 'Unknown Author',
            difficulty: storyDoc.difficulty || 'intermediate',
            estimatedReadTime: storyDoc.estimatedReadTime || 5,
            wordCount: storyDoc.wordCount || 1000,
            tags: storyDoc.categories?.map((c: any) => c.title) || [],
            createdAt: new Date(storyDoc.publishedAt || new Date()),
            updatedAt: new Date(storyDoc.publishedAt || new Date()),
        };
    }, [storyDoc]);

    // Data for UI
    const rating = ratingData?.averageRating || 0;
    const count = ratingData?.totalReviews || 0;
    const reviews = reviewsData || [];

    // Library integration
    const { actions: libraryActions } = useLibraryStore();
    const isInLibrary = story ? libraryActions.isInLibrary(story.id) : false;

    const handleBookmarkPress = async () => {
        if (!story) return;
        if (isInLibrary) {
            await libraryActions.removeFromLibrary(story.id);
        } else {
            await libraryActions.addToLibrary(story);
        }
    };

    const isLoading = loadingStory || loadingRating || loadingReviews;

    if (isLoading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!story) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }, styles.center]}>
                <Text style={styles.errorText}>Story not found</Text>
                <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Text style={{ color: theme.colors.primary }}>Go Back</Text>
                </Pressable>
            </View>
        );
    }

    const formatReadTime = (minutes: number): string => {
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    };

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contentContainer}
            >
                {/* Hero Image */}
                <ImageBackground
                    source={{ uri: story.coverImage }}
                    style={styles.heroImage}
                    resizeMode="cover"
                >
                    <LinearGradient
                        colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.8)']}
                        style={styles.heroGradient}
                    />
                    {/* Back Button */}
                    <Pressable
                        style={[styles.backButton, { top: insets.top + 8 }]}
                        onPress={() => router.back()}
                    >
                        <Ionicons
                            name="arrow-back"
                            size={24}
                            color={theme.colors.textInverse}
                        />
                    </Pressable>
                    {/* Bookmark Button */}
                    <Pressable
                        style={[styles.bookmarkButton, { top: insets.top + 8 }]}
                        onPress={handleBookmarkPress}
                    >
                        <Ionicons
                            name={isInLibrary ? 'bookmark' : 'bookmark-outline'}
                            size={24}
                            color={isInLibrary ? theme.colors.primary : theme.colors.textInverse}
                        />
                    </Pressable>
                </ImageBackground>

                {/* Content */}
                <View style={styles.content}>
                    {/* Title and Author */}
                    <View style={styles.titleSection}>
                        <Text style={styles.title}>{story.title}</Text>
                        <Text style={styles.author}>{story.author}</Text>
                    </View>

                    {/* Rating */}
                    <View style={styles.ratingRow}>
                        <RatingStars rating={rating} size="md" showEmpty />
                        <Text style={styles.ratingValue}>{rating.toFixed(1)}</Text>
                        <Text style={styles.ratingCount}>({count.toLocaleString()} reviews)</Text>
                    </View>

                    {/* Meta Info */}
                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Ionicons
                                name="time-outline"
                                size={18}
                                color={theme.colors.textSecondary}
                            />
                            <Text style={styles.metaText}>
                                {formatReadTime(story.estimatedReadTime)}
                            </Text>
                        </View>
                        <View style={styles.metaDivider} />
                        <View style={styles.metaItem}>
                            <Ionicons
                                name="document-text-outline"
                                size={18}
                                color={theme.colors.textSecondary}
                            />
                            <Text style={styles.metaText}>
                                {story.wordCount.toLocaleString()} words
                            </Text>
                        </View>
                        <View style={styles.metaDivider} />
                        <View style={styles.metaItem}>
                            <Ionicons
                                name="school-outline"
                                size={18}
                                color={theme.colors.textSecondary}
                            />
                            <Text style={styles.metaText}>
                                {story.difficulty.charAt(0).toUpperCase() + story.difficulty.slice(1)}
                            </Text>
                        </View>
                    </View>

                    {/* Tags */}
                    <View style={styles.tagsRow}>
                        {story.tags.map((tag) => (
                            <View key={tag} style={styles.tag}>
                                <Text style={styles.tagText}>{tag}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Description */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>About this story</Text>
                        <Text style={styles.description}>{story.description}</Text>
                    </View>

                    {/* Reviews Preview */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Reviews</Text>
                            <Pressable onPress={() => router.push(`/reviews/${story.id}`)}>
                                <Text style={styles.seeAllLink}>See All</Text>
                            </Pressable>
                        </View>
                        {reviews.length > 0 ? (
                            <View style={styles.reviewCard}>
                                <View style={styles.reviewHeader}>
                                    <Image
                                        source={{ uri: reviews[0].userAvatar }} // TODO: Handle review avatar logic properly
                                        style={styles.reviewerAvatar}
                                    />
                                    <View style={styles.reviewerInfo}>
                                        <Text style={styles.reviewerName}>{reviews[0].userName}</Text>
                                        <RatingStars rating={reviews[0].rating} size="sm" />
                                    </View>
                                </View>
                                <Text style={styles.reviewText} numberOfLines={3}>
                                    {reviews[0].text}
                                </Text>
                            </View>
                        ) : (
                            <Text style={styles.noReviewsText}>No reviews yet</Text>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Action */}
            <View style={[styles.bottomAction, { paddingBottom: insets.bottom + 16 }]}>
                <Pressable
                    style={styles.readButton}
                    onPress={() => router.push(`/reading/${story.id}`)}
                >
                    <Ionicons
                        name="book-outline"
                        size={20}
                        color={theme.colors.textInverse}
                    />
                    <Text style={styles.readButtonText}>Start Reading</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        paddingBottom: 100,
    },
    errorText: {
        fontSize: theme.typography.size.lg,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginTop: theme.spacing.xxxl,
    },
    heroImage: {
        height: 350,
        width: '100%',
    },
    heroGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    backButton: {
        position: 'absolute',
        left: theme.spacing.lg,
        width: 40,
        height: 40,
        borderRadius: theme.radius.full,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bookmarkButton: {
        position: 'absolute',
        right: theme.spacing.lg,
        width: 40,
        height: 40,
        borderRadius: theme.radius.full,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        padding: theme.spacing.xl,
        gap: theme.spacing.lg,
        marginTop: -theme.spacing.xxl,
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: theme.radius.xxl,
        borderTopRightRadius: theme.radius.xxl,
    },
    titleSection: {
        gap: theme.spacing.xs,
    },
    title: {
        fontSize: theme.typography.size.display,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
        letterSpacing: -0.5,
    },
    author: {
        fontSize: theme.typography.size.lg,
        color: theme.colors.textSecondary,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    ratingValue: {
        fontSize: theme.typography.size.lg,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    ratingCount: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textMuted,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        backgroundColor: theme.colors.backgroundSecondary,
        padding: theme.spacing.lg,
        borderRadius: theme.radius.xl,
    },
    metaItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.xs,
    },
    metaDivider: {
        width: 1,
        height: 24,
        backgroundColor: theme.colors.border,
    },
    metaText: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textSecondary,
        fontWeight: theme.typography.weight.medium,
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
    },
    tag: {
        backgroundColor: theme.colors.chipInactive,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.radius.full,
    },
    tagText: {
        fontSize: theme.typography.size.sm,
        fontWeight: theme.typography.weight.medium,
        color: theme.colors.text,
    },
    section: {
        gap: theme.spacing.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    sectionTitle: {
        fontSize: theme.typography.size.xl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    seeAllLink: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.primary,
    },
    description: {
        fontSize: theme.typography.size.lg,
        color: theme.colors.textSecondary,
        lineHeight: 26,
    },
    reviewCard: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.lg,
        borderRadius: theme.radius.xl,
        gap: theme.spacing.md,
        ...theme.shadows.sm,
    },
    reviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    reviewerAvatar: {
        width: 40,
        height: 40,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.borderLight,
    },
    reviewerInfo: {
        gap: 2,
    },
    reviewerName: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.text,
    },
    reviewText: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
        lineHeight: 22,
    },
    noReviewsText: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textMuted,
        textAlign: 'center',
        paddingVertical: theme.spacing.xl,
    },
    bottomAction: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: theme.spacing.xl,
        paddingTop: theme.spacing.lg,
        backgroundColor: theme.colors.background,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
    },
    readButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        backgroundColor: theme.colors.primary,
        height: 52,
        borderRadius: theme.radius.xl,
        ...theme.shadows.md,
    },
    readButtonText: {
        fontSize: theme.typography.size.lg,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.textInverse,
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center',
    },
}));
