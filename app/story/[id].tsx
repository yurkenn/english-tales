import React, { useMemo, useRef, useState, useCallback } from 'react';
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
    AuthorSection,
    StorySnippet,
    RelatedStories,
    StoryUnlockModal,
    PaywallModal,
} from '@/components';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    interpolate,
    Extrapolate,
    useAnimatedScrollHandler
} from 'react-native-reanimated';
import { useStory, useReviewsByStory, useStoryRating, useCreateReview } from '@/hooks/useQueries';
import { useFavorites } from '@/hooks/useFavorites';
import { urlFor } from '@/services/sanity/client';
import { Story } from '@/types';
import { useLibraryStore } from '@/store/libraryStore';
import { useAuthStore } from '@/store/authStore';
import { useDownloadStore } from '@/store/downloadStore';
import { useToastStore } from '@/store/toastStore';
import { haptics } from '@/utils/haptics';
import { PortableTextBlock } from '@portabletext/types';
import { useTranslation } from 'react-i18next';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useProgressStore } from '@/store/progressStore';
import { checkStoryAccess } from '@/services/storyGating';

interface StoryDetails extends Story {
    authorBio?: string;
    isPremiumOnly?: boolean;
}

export default function StoryDetailScreen() {
    const { theme } = useUnistyles();
    const router = useRouter();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams<{ id: string }>();
    const writeReviewSheetRef = useRef<BottomSheet>(null);
    const removeDownloadDialogRef = useRef<BottomSheet>(null);
    const scrollY = useSharedValue(0);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    // Auth & Library & Downloads
    const { user } = useAuthStore();
    const { actions: libraryActions } = useLibraryStore();
    const { downloads, actions: downloadActions } = useDownloadStore();
    const isPremium = useSubscriptionStore((s) => s.isPremium);
    const progressMap = useProgressStore((s) => s.progressMap);

    // Gating modals
    const [showUnlockModal, setShowUnlockModal] = useState(false);
    const [showPaywallModal, setShowPaywallModal] = useState(false);

    // Calculate how many stories user has interacted with for gating
    const storyIndex = useMemo(() => Object.keys(progressMap).length, [progressMap]);

    // Fetch data
    const { data: storyDoc, isLoading: loadingStory, error: errorStory, refetch: refetchStory } = useStory(id || '');

    // Sanity-based social features
    const { data: reviewsData, isLoading: loadingReviews, refetch: refreshReviews } = useReviewsByStory(id || '');
    const { data: ratingData } = useStoryRating(id || '');
    const createReview = useCreateReview();

    const reviews = reviewsData || [];
    const rating = ratingData?.averageRating || 0;
    const count = ratingData?.totalReviews || 0;

    const {
        isFavorited,
        toggleFavorite,
    } = useFavorites(id || '');

    // Transform Story
    const story = useMemo<Story | null>(() => {
        if (!storyDoc) return null;
        return {
            id: storyDoc._id,
            title: storyDoc.title,
            description: storyDoc.description,
            content: storyDoc.content ? (typeof storyDoc.content === 'string' ? storyDoc.content : '') : '',
            coverImage: storyDoc.coverImage ? urlFor(storyDoc.coverImage).width(800).url() : '',
            coverImageLqip: storyDoc.coverImageLqip,
            author: storyDoc.author?.name || 'Unknown Author',
            authorId: storyDoc.author?._id || null,
            authorBio: storyDoc.author?.bio,
            difficulty: storyDoc.difficulty || 'intermediate',
            estimatedReadTime: storyDoc.estimatedReadTime || 5,
            wordCount: storyDoc.wordCount || 1000,
            tags: storyDoc.categories?.map((c: any) => c.title) || [],
            createdAt: new Date(storyDoc.publishedAt || new Date()),
            updatedAt: new Date(storyDoc.publishedAt || new Date()),
            isPremiumOnly: storyDoc.isPremiumOnly,
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

    // Start reading with gating check
    const handleStartReading = useCallback(() => {
        if (!story) return;
        haptics.selection();

        // Check story access
        const accessResult = checkStoryAccess(story.id, storyIndex, story.isPremiumOnly);

        if (accessResult.status === 'free' || accessResult.status === 'unlocked') {
            // Can read directly
            requestAnimationFrame(() => {
                router.push(`/reading/${story.id}`);
            });
        } else {
            // Story is locked - show unlock modal
            setShowUnlockModal(true);
        }
    }, [story, isPremium, storyIndex, router]);

    const handleUnlockSuccess = useCallback(() => {
        setShowUnlockModal(false);
        if (story) {
            requestAnimationFrame(() => {
                router.push(`/reading/${story.id}`);
            });
        }
    }, [story, router]);

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

    const headerOpacity = useAnimatedStyle(() => {
        return {
            opacity: interpolate(
                scrollY.value,
                [300, 400],
                [0, 1],
                Extrapolate.CLAMP
            ),
        };
    });

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
            {/* Sticky Header */}
            <Animated.View style={[styles.stickyHeader, { paddingTop: insets.top }, headerOpacity]}>
                <View style={styles.stickyHeaderContent}>
                    <Pressable onPress={() => router.back()} style={styles.stickyBackButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                    </Pressable>
                    <Text style={styles.stickyTitle} numberOfLines={1}>{story.title}</Text>
                    <View style={{ width: 40 }} />
                </View>
            </Animated.View>

            <Animated.ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contentContainer}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
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
                        <Text style={styles.ratingCount}>
                            ({t('stories.details.reviewCount', { count })})
                        </Text>
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

                    {/* Story Snippet */}
                    <StorySnippet text={story.description.length > 100 ? story.description.substring(0, 150) + '...' : story.description} />

                    {/* Description */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('stories.details.about')}</Text>
                        <Text style={styles.description}>{story.description}</Text>
                    </View>

                    {/* Author Section */}
                    <AuthorSection
                        name={story.author}
                        bio={story.authorBio}
                        onPress={() => story.authorId && router.push(`/author/${story.authorId}`)}
                    />

                    {/* Related Stories */}
                    {storyDoc?.categories?.[0]?._id && (
                        <RelatedStories
                            categoryId={storyDoc.categories[0]._id}
                            currentStoryId={story.id}
                        />
                    )}

                    {/* Reviews Preview */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>{t('stories.details.reviews')}</Text>
                            <Pressable onPress={() => router.push(`/reviews/${story.id}`)}>
                                <Text style={styles.seeAllLink}>{t('stories.details.seeAll')}</Text>
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
                            <Text style={styles.noReviewsText}>{t('stories.details.noReviews')}</Text>
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
                                <Text style={styles.writeReviewText}>{t('stories.details.writeReview')}</Text>
                            </Pressable>
                        )}
                    </View>
                </View>
            </Animated.ScrollView>

            {/* Write Review Sheet */}
            <WriteReviewSheet
                ref={writeReviewSheetRef}
                storyTitle={story?.title || 'Story'}
                onClose={() => writeReviewSheetRef.current?.close()}
                onSubmit={async (rating, text) => {
                    if (!user || !story) return;
                    try {
                        await createReview.mutateAsync({
                            storyId: story.id,
                            userId: user.id,
                            userName: user.displayName || 'Anonymous',
                            userAvatar: user.photoURL || undefined,
                            rating,
                            text,
                        });
                        writeReviewSheetRef.current?.close();
                    } catch (error) {
                        console.error('Failed to submit review:', error);
                    }
                }}
            />
            <View style={[styles.bottomAction, { paddingBottom: insets.bottom + 16 }]}>
                <Pressable
                    style={styles.readButton}
                    onPress={handleStartReading}
                >
                    <Ionicons name="book-outline" size={20} color={theme.colors.textInverse} />
                    <Text style={styles.readButtonText}>{t('stories.details.startReading')}</Text>
                </Pressable>
            </View>

            {/* Story Unlock Modal */}
            <StoryUnlockModal
                visible={showUnlockModal}
                storyId={story?.id || ''}
                storyTitle={story?.title || ''}
                storyCover={story?.coverImage}
                isPremiumOnly={story?.isPremiumOnly}
                onClose={() => setShowUnlockModal(false)}
                onUnlocked={handleUnlockSuccess}
                onGetPremium={() => {
                    setShowUnlockModal(false);
                    setShowPaywallModal(true);
                }}
            />

            {/* Paywall Modal */}
            <PaywallModal
                visible={showPaywallModal}
                onClose={() => setShowPaywallModal(false)}
                onSuccess={() => {
                    setShowPaywallModal(false);
                    // After premium, go directly to reading
                    if (story) {
                        router.push(`/reading/${story.id}`);
                    }
                }}
            />

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
        paddingBottom: theme.spacing.xxxxl * 2,
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
        marginTop: -theme.spacing.xxxxl * 0.4,
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: theme.radius.xxl,
        borderTopRightRadius: theme.radius.xxl,
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
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.radius.md,
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
        borderRadius: theme.radius.lg,
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
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.surface,
        ...theme.shadows.sm,
    },
    writeReviewText: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.primary,
    },
    stickyHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: theme.colors.background,
        zIndex: 100,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
        ...theme.shadows.sm,
    },
    stickyHeaderContent: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
    },
    stickyBackButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stickyTitle: {
        flex: 1,
        fontSize: theme.typography.size.lg,
        fontWeight: 'bold',
        color: theme.colors.text,
        textAlign: 'center',
    },
}));
