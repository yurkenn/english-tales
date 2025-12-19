import { useState, useCallback, useEffect } from 'react';
import { reviewService } from '@/services/reviewService';
import { StoryReview } from '@/types';
import { useToastStore } from '@/store/toastStore';
import { haptics } from '@/utils/haptics';

export const useFirestoreReviews = (storyId: string) => {
    const [reviews, setReviews] = useState<StoryReview[]>([]);
    const [loading, setLoading] = useState(true);
    const toast = useToastStore(s => s.actions);

    const fetchReviews = useCallback(async () => {
        if (!storyId) return;
        setLoading(true);
        const result = await reviewService.getStoryReviews(storyId);
        if (result.success) {
            setReviews(result.data);
        }
        setLoading(false);
    }, [storyId]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const addReview = async (
        userId: string,
        userName: string,
        userPhoto: string | null,
        rating: number,
        comment: string
    ) => {
        haptics.success();
        const result = await reviewService.addReview(
            storyId,
            userId,
            userName,
            userPhoto,
            rating,
            comment
        );

        if (result.success) {
            toast.success('Review submitted successfully!');
            fetchReviews(); // Refresh
            return true;
        } else {
            toast.error(result.error || 'Failed to submit review');
            return false;
        }
    };

    return {
        reviews,
        loading,
        refresh: fetchReviews,
        addReview,
        averageRating: reviews.length > 0
            ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
            : 0,
        totalReviews: reviews.length,
    };
};
