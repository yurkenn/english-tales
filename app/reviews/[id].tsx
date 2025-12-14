import React, { useMemo } from 'react';
import { View, Text, FlatList, Pressable, Image, ActivityIndicator } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RatingStars } from '@/components';
import { useStory, useReviewsByStory, useStoryRating } from '@/hooks/useQueries';
import { Review } from '@/types';

export default function ReviewsScreen() {
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams<{ id: string }>();

    // Fetch data
    const { data: storyDoc } = useStory(id || '');
    const { data: reviewsData, isLoading: loadingReviews } = useReviewsByStory(id || '');
    const { data: ratingData } = useStoryRating(id || '');

    const reviews = reviewsData || [];
    const averageRating = ratingData?.averageRating || 0;
    const totalReviews = ratingData?.totalReviews || 0;

    const formatDate = (date: string | Date): string => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const renderReview = ({ item }: { item: Review }) => (
        <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
                <Image source={{ uri: item.userAvatar }} style={styles.avatar} />
                <View style={styles.reviewerInfo}>
                    <Text style={styles.reviewerName}>{item.userName}</Text>
                    <Text style={styles.reviewDate}>{formatDate(item.createdAt)}</Text>
                </View>
                <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={14} color={theme.colors.star} />
                    <Text style={styles.ratingText}>{item.rating}</Text>
                </View>
            </View>
            <Text style={styles.reviewText}>{item.text}</Text>
        </View>
    );

    if (loadingReviews) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons
                        name="arrow-back"
                        size={24}
                        color={theme.colors.text}
                    />
                </Pressable>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Reviews</Text>
                    {storyDoc && (
                        <Text style={styles.headerSubtitle} numberOfLines={1}>
                            {storyDoc.title}
                        </Text>
                    )}
                </View>
                <View style={{ width: 40 }} />
            </View>

            {/* Reviews List */}
            <FlatList
                data={reviews}
                keyExtractor={(item) => item._id}
                renderItem={renderReview}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons
                            name="chatbubble-outline"
                            size={64}
                            color={theme.colors.textMuted}
                        />
                        <Text style={styles.emptyTitle}>No reviews yet</Text>
                        <Text style={styles.emptySubtitle}>
                            Be the first to share your thoughts
                        </Text>
                    </View>
                }
                ListHeaderComponent={
                    reviews.length > 0 ? (
                        <View style={styles.statsSection}>
                            <View style={styles.overallRating}>
                                <Text style={styles.overallRatingValue}>{averageRating.toFixed(1)}</Text>
                                <RatingStars rating={averageRating} size="lg" showEmpty />
                                <Text style={styles.totalReviews}>
                                    {totalReviews} review{totalReviews !== 1 ? 's' : ''}
                                </Text>
                            </View>
                        </View>
                    ) : null
                }
            />
        </View>
    );
}

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: theme.radius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
        gap: 2,
    },
    headerTitle: {
        fontSize: theme.typography.size.xl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    headerSubtitle: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textSecondary,
    },
    listContent: {
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.xxxl,
    },
    statsSection: {
        paddingVertical: theme.spacing.xl,
        marginBottom: theme.spacing.md,
    },
    overallRating: {
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    overallRatingValue: {
        fontSize: 48,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    totalReviews: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.xs,
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
    avatar: {
        width: 40,
        height: 40,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.borderLight,
    },
    reviewerInfo: {
        flex: 1,
        gap: 2,
    },
    reviewerName: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.text,
    },
    reviewDate: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textMuted,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xxs,
        backgroundColor: theme.colors.backgroundSecondary,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.radius.md,
    },
    ratingText: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    reviewText: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
        lineHeight: 22,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.xxxxl,
        gap: theme.spacing.md,
    },
    emptyTitle: {
        fontSize: theme.typography.size.xl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    emptySubtitle: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
}));
