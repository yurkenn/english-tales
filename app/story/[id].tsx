import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useTheme, Theme } from '@/theme';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import Animated, { useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import {
    RatingStars,
    StoryHero,
    StoryMeta,
    NetworkError,
    DownloadButton,
    StoryDetailScreenSkeleton,
    AuthorSection,
    StorySnippet,
    RelatedStories,
} from '@/components';
import { StoryNavBar, StoryReviewsSection, StoryModals } from '@/components/molecules/story';

import { useAuthStore } from '@/store/authStore';
import { useStoryDetail, useStoryActions } from '@/hooks';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export default function StoryDetailScreen() {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const router = useRouter();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const { containerPadding } = useResponsiveLayout();
    const { id } = useLocalSearchParams<{ id: string }>();
    const scrollY = useSharedValue(0);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    // Auth
    const { user } = useAuthStore();

    // Data fetching
    const { story, storyDoc, reviews, rating, reviewCount, isLoading, error, refetch } = useStoryDetail(id || '');

    // Actions
    const actions = useStoryActions({
        story,
        storyDoc,
        userId: user?.id,
        userName: user?.displayName || undefined,
        userPhoto: user?.photoURL || undefined,
    });

    // Loading state
    if (isLoading) {
        return (
            <View style={styles.container}>
                <StoryDetailScreenSkeleton />
            </View>
        );
    }

    // Error/Empty states
    if (!story) {
        if (error) {
            return (
                <View style={[styles.container, { paddingTop: insets.top }, styles.center]}>
                    <NetworkError
                        message="Failed to load story. Please try again."
                        onRetry={refetch}
                    />
                </View>
            );
        }
        return (
            <View style={[styles.container, { paddingTop: insets.top }, styles.center]}>
                <Text style={styles.errorText}>Story not found</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }} activeOpacity={0.7}>
                    <Text style={{ color: theme.colors.primary }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <AnimatedScrollView
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
                />

                {/* Content */}
                <View style={[styles.content, { padding: containerPadding }]}>
                    {/* Title and Author */}
                    <View style={styles.titleSection}>
                        <Text style={styles.title}>{story.title}</Text>
                        <TouchableOpacity onPress={() => story.authorId && router.push(`/author/${story.authorId}`)} activeOpacity={0.7}>
                            <Text style={[styles.author, story.authorId && { color: theme.colors.primary }]}>{story.author}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Rating */}
                    <View style={styles.ratingRow}>
                        <RatingStars rating={rating} size="md" showEmpty />
                        <Text style={styles.ratingValue}>{rating.toFixed(1)}</Text>
                        <Text style={styles.ratingCount}>
                            ({t('stories.details.reviewCount', { count: reviewCount })})
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
                        status={actions.downloadActions.getDownloadStatus(story.id)}
                        sizeBytes={actions.downloads[story.id]?.sizeBytes}
                        onDownload={actions.handleDownload}
                        onDelete={actions.handleOpenRemoveDialog}
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

                    {/* Reviews Section */}
                    <StoryReviewsSection
                        storyId={story.id}
                        reviews={reviews}
                        isLoggedIn={!!user && !user.isAnonymous}
                        onWriteReview={actions.handleOpenWriteReview}
                    />
                </View>
            </AnimatedScrollView>

            {/* Bottom Action Button */}
            <View style={[styles.bottomAction, { paddingBottom: insets.bottom + 16, paddingHorizontal: containerPadding }]}>
                <TouchableOpacity
                    style={styles.readButton}
                    onPress={actions.handleStartReading}
                    activeOpacity={0.8}
                >
                    <Ionicons name="book-outline" size={20} color={theme.colors.textInverse} />
                    <Text style={styles.readButtonText}>{t('stories.details.startReading')}</Text>
                </TouchableOpacity>
            </View>

            {/* Navigation Bar */}
            <StoryNavBar
                topInset={insets.top}
                isFavorited={actions.isFavorited}
                isInLibrary={actions.isInLibrary}
                onBack={() => router.back()}
                onFavorite={actions.handleFavoritePress}
                onBookmark={actions.handleBookmarkPress}
                onShare={actions.handleSharePress}
            />

            {/* All Modals */}
            <StoryModals
                writeReviewRef={actions.writeReviewSheetRef}
                storyTitle={story.title}
                onSubmitReview={actions.handleSubmitReview}
                removeDownloadRef={actions.removeDownloadDialogRef}
                onConfirmRemoveDownload={actions.handleRemoveDownload}
                showUnlockModal={actions.showUnlockModal}
                storyId={story.id}
                storyCover={story.coverImage}
                isPremiumOnly={story.isPremiumOnly}
                onCloseUnlock={() => actions.setShowUnlockModal(false)}
                onUnlocked={actions.handleUnlockSuccess}
                onGetPremium={() => {
                    actions.setShowUnlockModal(false);
                    actions.setShowPaywallModal(true);
                }}
                showPaywallModal={actions.showPaywallModal}
                onClosePaywall={() => actions.setShowPaywallModal(false)}
                onPaywallSuccess={actions.handlePaywallSuccess}
            />
        </View>
    );
}

function createStyles(theme: Theme) {
    return StyleSheet.create({
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
        center: {
            alignItems: 'center',
            justifyContent: 'center',
        },
        content: {
            padding: theme.spacing.lg,
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
        sectionTitle: {
            fontSize: theme.typography.size.xl,
            fontWeight: theme.typography.weight.bold,
            color: theme.colors.text,
        },
        description: {
            fontSize: theme.typography.size.md,
            color: theme.colors.textSecondary,
            lineHeight: 26,
        },
        bottomAction: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: theme.spacing.lg,
            paddingTop: theme.spacing.md,
            backgroundColor: theme.colors.background,
            borderTopWidth: 1,
            borderTopColor: theme.colors.borderLight,
            zIndex: 50,
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
    });
}
