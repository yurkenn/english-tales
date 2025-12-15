import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
    RatingStars,
    WriteReviewModal,
    StoryHero,
    StoryMeta,
    ReviewCard,
} from '@/components';
import { useStory, useStoryRating, useReviewsByStory, useCreateReview } from '@/hooks/useQueries';
import { urlFor } from '@/services/sanity/client';
import { Story } from '@/types';
import { useLibraryStore } from '@/store/libraryStore';
import { useAuthStore } from '@/store/authStore';

export default function StoryDetailScreen() {
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [showReviewModal, setShowReviewModal] = useState(false);

    // Auth & Library
    const { user } = useAuthStore();
    const { actions: libraryActions } = useLibraryStore();
    const createReview = useCreateReview();

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

    const rating = ratingData?.averageRating || 0;
    const count = ratingData?.totalReviews || 0;
    const reviews = reviewsData || [];
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

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contentContainer}
            >
                {/* Hero Image */}
                <StoryHero
                    coverImage={story.coverImage}
                    onBackPress={() => router.back()}
                    onBookmarkPress={handleBookmarkPress}
                    isBookmarked={isInLibrary}
                    topInset={insets.top}
                />

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
                    <StoryMeta
                        readTime={story.estimatedReadTime}
                        wordCount={story.wordCount}
                        difficulty={story.difficulty}
                    />

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
                            <ReviewCard
                                userName={reviews[0].userName}
                                userAvatar={reviews[0].userAvatar}
                                rating={reviews[0].rating}
                                text={reviews[0].text}
                            />
                        ) : (
                            <Text style={styles.noReviewsText}>No reviews yet</Text>
                        )}

                        {user && !user.isAnonymous && (
                            <Pressable style={styles.writeReviewButton} onPress={() => setShowReviewModal(true)}>
                                <Ionicons name="create-outline" size={18} color={theme.colors.primary} />
                                <Text style={styles.writeReviewText}>Write a Review</Text>
                            </Pressable>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Write Review Modal */}
            <WriteReviewModal
                visible={showReviewModal}
                onClose={() => setShowReviewModal(false)}
                storyTitle={story.title}
                onSubmit={async (rating, text) => {
                    if (!user || !story) return;
                    await createReview.mutateAsync({
                        storyId: story.id,
                        userId: user.id,
                        userName: user.displayName || 'Anonymous',
                        userAvatar: user.photoURL || undefined,
                        rating,
                        text,
                    });
                }}
            />

            {/* Bottom Action */}
            <View style={[styles.bottomAction, { paddingBottom: insets.bottom + 16 }]}>
                <Pressable style={styles.readButton} onPress={() => router.push(`/reading/${story.id}`)}>
                    <Ionicons name="book-outline" size={20} color={theme.colors.textInverse} />
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
    writeReviewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.xs,
        paddingVertical: theme.spacing.md,
        marginTop: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.primary,
        borderRadius: theme.radius.lg,
    },
    writeReviewText: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.primary,
    },
}));
