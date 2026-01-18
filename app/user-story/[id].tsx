import { useCallback, useMemo, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Share, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme, Theme } from '@/theme';
import { Typography } from '@/components/atoms/Typography';
import { DifficultyBadge } from '@/components/atoms/DifficultyBadge';
import { Button } from '@/components/atoms/Button';
import { UserStoryReviewCard, WriteUserStoryReviewModal, ReportModal } from '@/components/molecules/community';
import { useUserStory } from '@/hooks/useQueries';
import { useUserStoryReviews } from '@/hooks/useUserStoryReviews';
import { useUserStoryFavorite } from '@/hooks/useUserStoryFavorite';
import { useAuthStore } from '@/store/authStore';
import { haptics } from '@/utils/haptics';

export default function UserStoryDetailScreen() {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams<{ id: string }>();

    const { data: story, isLoading, error } = useUserStory(id);
    const { user } = useAuthStore();
    const { reviews, averageRating, reviewCount, userReview, isSubmitting, submitReview, updateReview, deleteReview, markHelpful } = useUserStoryReviews(id);
    const { isFavorited, favoriteCount, toggleFavorite } = useUserStoryFavorite(id);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);

    const handleToggleFavorite = useCallback(async () => {
        if (!user) {
            Alert.alert('Sign In Required', 'Please sign in to save favorites.');
            return;
        }
        haptics.selection();
        await toggleFavorite();
    }, [user, toggleFavorite]);

    const handleBack = useCallback(() => {
        haptics.selection();
        router.back();
    }, [router]);

    const handleStartReading = useCallback(() => {
        haptics.success();
        router.push(`/reading/${id}?source=community` as any);
    }, [router, id]);

    const handleShare = useCallback(async () => {
        if (!story) return;
        haptics.selection();

        const difficultyText = story.difficulty === 'beginner' ? 'beginners'
            : story.difficulty === 'intermediate' ? 'intermediate learners'
                : 'advanced learners';

        const shareMessage = `📖 "${story.title}" by ${story.authorName}\n\n${story.description || ''}\n\n🌟 A community story for ${difficultyText} on English Tales!`;

        try {
            await Share.share({
                message: shareMessage,
                title: `Share "${story.title}"`,
            });
        } catch (error) {
            console.log('Share error:', error);
        }
    }, [story]);

    const handleViewAuthor = useCallback(() => {
        if (!story) return;
        haptics.selection();
        router.push({
            pathname: '/author/[authorId]',
            params: {
                authorId: story.authorId,
                authorName: story.authorName,
                authorAvatar: story.authorAvatar || '',
            },
        } as any);
    }, [story, router]);

    const readTime = useMemo(() => {
        if (!story?.wordCount) return 3;
        return Math.ceil(story.wordCount / 200);
    }, [story?.wordCount]);

    if (isLoading) {
        return (
            <View style={[styles.container, styles.center]}>
                <Typography>Loading...</Typography>
            </View>
        );
    }

    if (error || !story) {
        return (
            <View style={[styles.container, styles.center]}>
                <Feather name="alert-circle" size={48} color={theme.colors.error} />
                <Typography style={{ marginTop: 16 }}>Story not found</Typography>
                <Button title="Go Back" onPress={handleBack} style={{ marginTop: 24 }} />
            </View>
        );
    }

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.container}>
                <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                    <Pressable onPress={handleBack} style={styles.backButton}>
                        <Feather name="arrow-left" size={24} color={theme.colors.text} />
                    </Pressable>
                    <View style={styles.headerBadge}>
                        <Feather name="users" size={14} color={theme.colors.primary} />
                        <Typography variant="caption" style={{ color: theme.colors.primary, marginLeft: 4 }}>
                            Community Story
                        </Typography>
                    </View>
                    <View style={styles.headerActions}>
                        <Pressable onPress={handleToggleFavorite} style={styles.headerButton}>
                            <Feather
                                name={isFavorited ? 'heart' : 'heart'}
                                size={22}
                                color={isFavorited ? '#FF4757' : theme.colors.text}
                                style={{ opacity: isFavorited ? 1 : 0.7 }}
                            />
                        </Pressable>
                        <Pressable onPress={handleShare} style={styles.headerButton}>
                            <Feather name="share-2" size={22} color={theme.colors.text} />
                        </Pressable>
                        <Pressable onPress={() => setShowReportModal(true)} style={styles.headerButton}>
                            <Feather name="flag" size={20} color={theme.colors.textMuted} />
                        </Pressable>
                    </View>
                </View>

                <ScrollView
                    style={styles.content}
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
                    showsVerticalScrollIndicator={false}
                >
                    {story.coverImageUrl && (
                        <Image
                            source={{ uri: story.coverImageUrl }}
                            style={styles.coverImage}
                            contentFit="cover"
                            transition={300}
                        />
                    )}

                    <View style={styles.titleSection}>
                        <Typography variant="h1" style={styles.title}>
                            {story.title}
                        </Typography>

                        <Pressable onPress={handleViewAuthor} style={styles.authorRow}>
                            {story.authorAvatar ? (
                                <Image source={{ uri: story.authorAvatar }} style={styles.authorAvatar} contentFit="cover" />
                            ) : (
                                <View style={[styles.authorAvatarPlaceholder, { backgroundColor: theme.colors.border }]}>
                                    <Feather name="user" size={16} color={theme.colors.textMuted} />
                                </View>
                            )}
                            <View style={styles.authorInfo}>
                                <Typography variant="body" weight="medium">{story.authorName}</Typography>
                                <Typography variant="caption" color={theme.colors.textMuted}>Tap to view profile</Typography>
                            </View>
                            <Feather name="chevron-right" size={20} color={theme.colors.textMuted} />
                        </Pressable>

                        <View style={styles.metaRow}>
                            <DifficultyBadge difficulty={story.difficulty} size="medium" />
                            <View style={styles.metaItem}>
                                <Feather name="clock" size={14} color={theme.colors.textMuted} />
                                <Typography variant="caption" color={theme.colors.textMuted} style={{ marginLeft: 4 }}>
                                    {readTime} min
                                </Typography>
                            </View>
                            <View style={styles.metaItem}>
                                <Feather name="heart" size={14} color="#FF4757" />
                                <Typography variant="caption" color={theme.colors.textMuted} style={{ marginLeft: 4 }}>
                                    {favoriteCount}
                                </Typography>
                            </View>
                        </View>
                    </View>

                    {story.description && (
                        <View style={styles.section}>
                            <Typography variant="body" color={theme.colors.textSecondary} style={styles.description}>
                                {story.description}
                            </Typography>
                        </View>
                    )}

                    {/* Preview Snippet */}
                    {story.content && Array.isArray(story.content) && (
                        <View style={styles.section}>
                            <Typography variant="h3" style={styles.sectionTitle}>Preview</Typography>
                            <View style={styles.previewContainer}>
                                {(() => {
                                    const firstBlock = story.content.find((block: any) =>
                                        block._type === 'block' && block.children
                                    );
                                    if (!firstBlock) return null;
                                    const text = firstBlock.children.map((c: any) => c.text || '').join('');
                                    const preview = text.length > 200 ? text.substring(0, 200) + '...' : text;
                                    return (
                                        <Typography variant="body" color={theme.colors.textSecondary} style={styles.previewText}>
                                            {preview}
                                        </Typography>
                                    );
                                })()}
                            </View>
                        </View>
                    )}

                    {/* Rating & Reviews Section */}
                    <View style={styles.section}>
                        <View style={styles.ratingHeader}>
                            <View style={styles.ratingInfo}>
                                <Typography variant="h3">Reviews</Typography>
                                {reviewCount > 0 && (
                                    <View style={styles.averageRating}>
                                        <Feather name="star" size={16} color="#FFB800" />
                                        <Typography variant="body" weight="bold" style={{ marginLeft: 4 }}>
                                            {averageRating}
                                        </Typography>
                                        <Typography variant="caption" color={theme.colors.textMuted} style={{ marginLeft: 4 }}>
                                            ({reviewCount})
                                        </Typography>
                                    </View>
                                )}
                            </View>
                            <Pressable
                                onPress={() => {
                                    if (!user) {
                                        Alert.alert('Sign In Required', 'Please sign in to write a review.');
                                        return;
                                    }
                                    haptics.selection();
                                    setShowReviewModal(true);
                                }}
                                style={styles.writeReviewButton}
                            >
                                <Feather name="edit-3" size={16} color={theme.colors.primary} />
                                <Typography variant="caption" style={{ color: theme.colors.primary, marginLeft: 6 }}>
                                    {userReview ? 'Edit' : 'Write'}
                                </Typography>
                            </Pressable>
                        </View>

                        {reviews.length > 0 ? (
                            <View>
                                {reviews.map((review) => (
                                    <UserStoryReviewCard
                                        key={review.id}
                                        review={review}
                                        isOwn={user?.id === review.userId}
                                        onEdit={() => setShowReviewModal(true)}
                                        onDelete={() => {
                                            Alert.alert(
                                                'Delete Review',
                                                'Are you sure you want to delete your review?',
                                                [
                                                    { text: 'Cancel', style: 'cancel' },
                                                    { text: 'Delete', style: 'destructive', onPress: deleteReview },
                                                ]
                                            );
                                        }}
                                        onHelpful={() => markHelpful(review.id)}
                                    />
                                ))}
                            </View>
                        ) : (
                            <View style={styles.reviewPlaceholder}>
                                <Feather name="message-circle" size={32} color={theme.colors.textMuted} />
                                <Typography variant="body" color={theme.colors.textMuted} style={{ marginTop: 12, textAlign: 'center' }}>
                                    No reviews yet.{'\n'}Be the first to share your thoughts!
                                </Typography>
                            </View>
                        )}
                    </View>
                </ScrollView>

                <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
                    <Button title="Start Reading" onPress={handleStartReading} fullWidth />
                </View>

                <WriteUserStoryReviewModal
                    visible={showReviewModal}
                    storyTitle={story.title}
                    initialRating={userReview?.rating}
                    initialContent={userReview?.content}
                    isEditing={!!userReview}
                    isSubmitting={isSubmitting}
                    onClose={() => setShowReviewModal(false)}
                    onSubmit={userReview ? updateReview : submitReview}
                />

                <ReportModal
                    visible={showReportModal}
                    onClose={() => setShowReportModal(false)}
                    contentType="story"
                    contentId={id}
                />
            </View>
        </>
    );
}

function createStyles(theme: Theme) {
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.colors.background },
        center: { justifyContent: 'center', alignItems: 'center' },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingBottom: 12,
            backgroundColor: theme.colors.background,
            zIndex: 10,
        },
        backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
        headerBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 6,
            backgroundColor: theme.colors.primary + '15',
            borderRadius: 20,
        },
        headerActions: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
        },
        headerButton: {
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center'
        },
        content: { flex: 1 },
        scrollContent: { paddingHorizontal: 20 },
        coverImage: { width: '100%', height: 200, borderRadius: 16, marginBottom: 20 },
        titleSection: { gap: 16, marginBottom: 24 },
        title: { fontSize: 28, lineHeight: 36 },
        authorRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
        authorAvatar: { width: 44, height: 44, borderRadius: 22 },
        authorAvatarPlaceholder: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
        authorInfo: { flex: 1 },
        metaRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
        metaItem: { flexDirection: 'row', alignItems: 'center' },
        section: { marginBottom: 24 },
        sectionTitle: { marginBottom: 12 },
        description: { lineHeight: 24 },
        previewContainer: {
            position: 'relative',
            overflow: 'hidden',
        },
        previewText: {
            lineHeight: 26,
            fontStyle: 'italic',
        },
        ratingHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
        },
        ratingInfo: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
        },
        averageRating: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        writeReviewButton: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 8,
            backgroundColor: theme.colors.primary + '10',
            borderRadius: 20,
        },
        reviewPlaceholder: {
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 32,
            backgroundColor: theme.colors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        bottomBar: {
            paddingHorizontal: 20,
            paddingTop: 16,
            backgroundColor: theme.colors.background,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
        },
    });
}
