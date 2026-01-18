import { useState, useCallback, useEffect } from 'react';
import { userStoryReviewService, UserStoryReview } from '@/services/userStoryReviewService';
import { useAuthStore } from '@/store/authStore';

interface UseUserStoryReviewsResult {
    reviews: UserStoryReview[];
    averageRating: number;
    reviewCount: number;
    userReview: UserStoryReview | null;
    isLoading: boolean;
    isSubmitting: boolean;
    error: string | null;
    submitReview: (rating: number, content: string) => Promise<boolean>;
    updateReview: (rating: number, content: string) => Promise<boolean>;
    deleteReview: () => Promise<boolean>;
    markHelpful: (reviewId: string) => Promise<void>;
    refetch: () => Promise<void>;
}

export function useUserStoryReviews(storyId: string | undefined): UseUserStoryReviewsResult {
    const { user } = useAuthStore();
    const [reviews, setReviews] = useState<UserStoryReview[]>([]);
    const [averageRating, setAverageRating] = useState(0);
    const [reviewCount, setReviewCount] = useState(0);
    const [userReview, setUserReview] = useState<UserStoryReview | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchReviews = useCallback(async () => {
        if (!storyId) return;

        setIsLoading(true);
        setError(null);

        try {
            const [reviewsData, ratingData] = await Promise.all([
                userStoryReviewService.getReviewsForStory(storyId),
                userStoryReviewService.getAverageRating(storyId),
            ]);

            setReviews(reviewsData);
            setAverageRating(ratingData.average);
            setReviewCount(ratingData.count);

            // Find user's review if logged in
            if (user) {
                const existing = reviewsData.find((r) => r.userId === user.id);
                setUserReview(existing || null);
            }
        } catch (err) {
            console.error('Error fetching reviews:', err);
            setError('Failed to load reviews');
        } finally {
            setIsLoading(false);
        }
    }, [storyId, user]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const submitReview = useCallback(async (rating: number, content: string): Promise<boolean> => {
        if (!storyId || !user) {
            setError('You must be logged in to review');
            return false;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await userStoryReviewService.createReview({
                storyId,
                userId: user.id,
                userName: user.displayName || 'Anonymous',
                userAvatar: user.photoURL || undefined,
                rating,
                content,
            });

            await fetchReviews();
            return true;
        } catch (err: any) {
            console.error('Error submitting review:', err);
            setError(err.message || 'Failed to submit review');
            return false;
        } finally {
            setIsSubmitting(false);
        }
    }, [storyId, user, fetchReviews]);

    const updateReview = useCallback(async (rating: number, content: string): Promise<boolean> => {
        if (!userReview || !user) {
            setError('No review to update');
            return false;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await userStoryReviewService.updateReview(userReview.id, user.id, { rating, content });
            await fetchReviews();
            return true;
        } catch (err: any) {
            console.error('Error updating review:', err);
            setError(err.message || 'Failed to update review');
            return false;
        } finally {
            setIsSubmitting(false);
        }
    }, [userReview, user, fetchReviews]);

    const deleteReview = useCallback(async (): Promise<boolean> => {
        if (!userReview || !user) {
            setError('No review to delete');
            return false;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await userStoryReviewService.deleteReview(userReview.id, user.id);
            await fetchReviews();
            return true;
        } catch (err: any) {
            console.error('Error deleting review:', err);
            setError(err.message || 'Failed to delete review');
            return false;
        } finally {
            setIsSubmitting(false);
        }
    }, [userReview, user, fetchReviews]);

    const markHelpful = useCallback(async (reviewId: string): Promise<void> => {
        try {
            await userStoryReviewService.markHelpful(reviewId);
            // Update local state
            setReviews((prev) =>
                prev.map((r) => (r.id === reviewId ? { ...r, helpful: r.helpful + 1 } : r))
            );
        } catch (err) {
            console.error('Error marking helpful:', err);
        }
    }, []);

    return {
        reviews,
        averageRating,
        reviewCount,
        userReview,
        isLoading,
        isSubmitting,
        error,
        submitReview,
        updateReview,
        deleteReview,
        markHelpful,
        refetch: fetchReviews,
    };
}
