import React, { useMemo, useState, useRef } from 'react';
import { View, Text, ScrollView, Pressable, Share } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import {
    RatingStars,
    WriteReviewSheet,
    StoryHero,
    StoryMeta,
    ReviewCard,
    NetworkError,
    DownloadButton,
    ConfirmationDialog,
    StoryDetailScreenSkeleton,
} from '@/components';
import { useStory } from '@/hooks/useQueries';
import { useFirestoreReviews } from '@/hooks/useFirestoreReviews';
import { useFavorites } from '@/hooks/useFavorites';
import { urlFor } from '@/services/sanity/client';
import { Story } from '@/types';
import { useLibraryStore } from '@/store/libraryStore';
import { useAuthStore } from '@/store/authStore';
import { useDownloadStore } from '@/store/downloadStore';
import { useToastStore } from '@/store/toastStore';
import { haptics } from '@/utils/haptics';
import { PortableTextBlock } from '@portabletext/types';

export default function StoryDetailScreen() {
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams<{ id: string }>();
    const writeReviewSheetRef = useRef<BottomSheet>(null);
    const removeDownloadDialogRef = useRef<BottomSheet>(null);

    // Auth & Library & Downloads
    const { user } = useAuthStore();
    const { actions: libraryActions } = useLibraryStore();
    const { downloads, actions: downloadActions } = useDownloadStore();

    // Fetch data
    const { data: storyDoc, isLoading: loadingStory, error: errorStory, refetch: refetchStory } = useStory(id || '');

    // Firestore social features
    const {
        reviews,
        loading: loadingReviews,
        addReview,
        averageRating: rating,
        totalReviews: count,
        refresh: refreshReviews
    } = useFirestoreReviews(id || '');

    const {
        isFavorited,
        toggleFavorite,
    } = useFavorites(id || '');

    // Transform Story
    const story = useMemo(() => {
        if (!storyDoc) return null;
        return {
            id: storyDoc._id,
            title: storyDoc.title,
            description: storyDoc.description,
            content: storyDoc.content || '',
            coverImage: storyDoc.coverImage ? urlFor(storyDoc.coverImage).width(800).url() : '',
            coverImageLqip: storyDoc.coverImageLqip,
            author: storyDoc.author?.name || 'Unknown Author',
            authorId: storyDoc.author?._id || null,
            difficulty: storyDoc.difficulty || 'intermediate',
            estimatedReadTime: storyDoc.estimatedReadTime || 5,
            wordCount: storyDoc.wordCount || 1000,
            tags: storyDoc.categories?.map((c: any) => c.title) || [],
            createdAt: new Date(storyDoc.publishedAt || new Date()),
            updatedAt: new Date(storyDoc.publishedAt || new Date()),
        };
    }, [storyDoc]);

    const isInLibrary = story ? libraryActions.isInLibrary(story.id) : false;

    const handleBookmarkPress = async () => {
        if (!story) return;
        haptics.selection();
        if (isInLibrary) {
            await libraryActions.removeFromLibrary(story.id);
        } else {
            await libraryActions.addToLibrary(story);
        }
    };

    const handleFavoritePress = async () => {
        if (!story) return;
        await toggleFavorite(story.title, story.coverImage);
    };

    const handleSharePress = async () => {
        if (!story) return;
        haptics.selection();
        try {
            await Share.share({
                title: story.title,
                message: `Check out this story on English Tales: ${story.title}\n\n${story.description}`,
            });
        } catch (error) {
            console.error('Error sharing story:', error);
        }
    };

    const isLoading = loadingStory || loadingReviews;

    if (isLoading) {
        return (
            <View style={styles.container}>
                <StoryDetailScreenSkeleton />
            </View>
        );
    }

    if (!story) {
        if (errorStory) {
            return (
                <View style={[styles.container, { paddingTop: insets.top }, styles.center]}>
                    <NetworkError
                        message="Failed to load story. Please try again."
                        onRetry={() => {
                            refetchStory();
                            refreshReviews();
                        }}
                    />
                </View>
            );
        }
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
                    storyId={story.id}
                    coverImage={story.coverImage}
                    coverImageLqip={story.coverImageLqip}
                    onBackPress={() => router.back()}
                    onBookmarkPress={handleBookmarkPress}
                    isBookmarked={isInLibrary}
                    onFavoritePress={handleFavoritePress}
                    isFavorited={isFavorited}
                    topInset={insets.top}
                    onSharePress={handleSharePress}
                />

                {/* Content */}
                <View style={styles.content}>
                    {/* Title and Author */}
                    <View style={styles.titleSection}>
                        <Text style={styles.title}>{story.title}</Text>
                        <Pressable onPress={() => story.authorId && router.push(`/author/${story.authorId}`)}>
                            <Text style={[styles.author, story.authorId && { color: theme.colors.primary }]}>{story.author}</Text>
                        </Pressable>
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

                    {/* Download for Offline */}
                    <DownloadButton
                        status={downloadActions.getDownloadStatus(story.id)}
                        sizeBytes={downloads[story.id]?.sizeBytes}
                        onDownload={async () => {
                            haptics.selection();
                            const toastActions = useToastStore.getState().actions;
                            const content = storyDoc?.content as PortableTextBlock[] | undefined;
                            if (content) {
                                const success = await downloadActions.downloadStory(story as any, content);
                                if (success) {
                                    haptics.success();
                                    toastActions.success('Downloaded for offline reading');
                                } else {
                                    toastActions.error('Download failed. Please try again.');
                                }
                            }
                        }}
                        onDelete={() => {
                            haptics.selection();
                            removeDownloadDialogRef.current?.expand();
                        }}
                    />

                    {/* Tags */}
                    <View style={styles.tagsRow}>
                        {story.tags.map((tag: string) => (
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
                                userAvatar={reviews[0].userPhoto || undefined}
                                rating={reviews[0].rating}
                                text={reviews[0].comment}
                            />
                        ) : (
                            <Text style={styles.noReviewsText}>No reviews yet</Text>
                        )}

                        {user && !user.isAnonymous && (
                            <Pressable
                                style={styles.writeReviewButton}
                                onPress={() => {
                                    haptics.selection();
                                    writeReviewSheetRef.current?.expand();
                                }}
                            >
                                <Ionicons name="create-outline" size={18} color={theme.colors.primary} />
                                <Text style={styles.writeReviewText}>Write a Review</Text>
                            </Pressable>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Write Review Sheet */}
            <WriteReviewSheet
                ref={writeReviewSheetRef}
                storyTitle={story.title}
                onSubmit={async (rating, text) => {
                    if (!user || !story) return;
                    await addReview(
                        story.title,
                        user.id,
                        user.displayName || 'Anonymous',
                        user.photoURL,
                        rating,
                        text
                    );
                }}
                onClose={() => writeReviewSheetRef.current?.close()}
            />

            {/* Bottom Action */}
            <View style={[styles.bottomAction, { paddingBottom: insets.bottom + 16 }]}>
                <Pressable style={styles.readButton} onPress={() => router.push(`/reading/${story.id}`)}>
                    <Ionicons name="book-outline" size={20} color={theme.colors.textInverse} />
                    <Text style={styles.readButtonText}>Start Reading</Text>
                </Pressable>
            </View>

            {/* Confirmation Dialog */}
            <ConfirmationDialog
                ref={removeDownloadDialogRef}
                title="Remove Download"
                message="This story will no longer be available offline."
                confirmLabel="Remove"
                cancelLabel="Cancel"
                destructive
                icon="cloud-offline-outline"
                onConfirm={async () => {
                    await downloadActions.deleteDownload(story.id);
                    haptics.selection();
                    removeDownloadDialogRef.current?.close();
                    useToastStore.getState().actions.success('Download removed');
                }}
                onCancel={() => removeDownloadDialogRef.current?.close()}
            />
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
        paddingBottom: 120,
    },
    errorText: {
        fontSize: theme.typography.size.lg,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginTop: theme.spacing.xxxl,
    },
    content: {
        padding: theme.spacing.xl,
        gap: theme.spacing.xl,
        marginTop: -24,
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    titleSection: {
        gap: theme.spacing.xs,
    },
    title: {
        fontSize: theme.typography.size.display,
        fontWeight: 'bold',
        color: theme.colors.text,
        letterSpacing: -1,
    },
    author: {
        fontSize: theme.typography.size.lg,
        color: theme.colors.textMuted,
        fontWeight: theme.typography.weight.medium,
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
        backgroundColor: theme.colors.surface,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.sm,
    },
    tagText: {
        fontSize: theme.typography.size.sm,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
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
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.primary,
    },
    description: {
        fontSize: theme.typography.size.md,
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
        paddingTop: theme.spacing.md,
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
        height: 56,
        borderRadius: 16,
        ...theme.shadows.md,
    },
    readButtonText: {
        fontSize: theme.typography.size.xl,
        fontWeight: 'bold',
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
        borderColor: theme.colors.borderLight,
        borderRadius: 16,
        backgroundColor: theme.colors.surface,
        ...theme.shadows.sm,
    },
    writeReviewText: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.primary,
    },
}));
