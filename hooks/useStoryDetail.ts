import { useMemo } from 'react';
import { useStory, useReviewsByStory, useStoryRating } from '@/hooks/useQueries';
import { urlFor } from '@/services/sanity/client';
import { Story } from '@/types';

export interface StoryDetails extends Story {
    authorBio?: string;
    isPremiumOnly?: boolean;
}

interface UseStoryDetailResult {
    story: StoryDetails | null;
    storyDoc: any;
    reviews: any[];
    rating: number;
    reviewCount: number;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
    refreshReviews: () => void;
}

/**
 * Custom hook for fetching and transforming story detail data.
 */
export function useStoryDetail(storyId: string): UseStoryDetailResult {
    const {
        data: storyDoc,
        isLoading: loadingStory,
        error: errorStory,
        refetch: refetchStory
    } = useStory(storyId || '');

    const {
        data: reviewsData,
        isLoading: loadingReviews,
        refetch: refreshReviews
    } = useReviewsByStory(storyId || '');

    const { data: ratingData } = useStoryRating(storyId || '');

    const reviews = reviewsData || [];
    const rating = ratingData?.averageRating || 0;
    const reviewCount = ratingData?.totalReviews || 0;

    // Transform storyDoc to Story type
    const story = useMemo<StoryDetails | null>(() => {
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

    const refetch = () => {
        refetchStory();
        refreshReviews();
    };

    return {
        story,
        storyDoc,
        reviews,
        rating,
        reviewCount,
        isLoading: loadingStory || loadingReviews,
        error: errorStory as Error | null,
        refetch,
        refreshReviews,
    };
}
