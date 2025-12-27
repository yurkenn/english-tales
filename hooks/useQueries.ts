import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sanityClient, sanityWriteClient, queries } from '@/services/sanity';

// Query Keys
export const queryKeys = {
    stories: {
        all: ['stories'] as const,
        featured: ['stories', 'featured'] as const,
        byId: (id: string) => ['stories', id] as const,
        bySlug: (slug: string) => ['stories', 'slug', slug] as const,
        byCategory: (categoryId: string) => ['stories', 'category', categoryId] as const,
        search: (query: string) => ['stories', 'search', query] as const,
    },
    authors: {
        all: ['authors'] as const,
        featured: ['authors', 'featured'] as const,
        byId: (id: string) => ['authors', id] as const,
    },
    categories: {
        all: ['categories'] as const,
    },
    reviews: {
        byStory: (storyId: string) => ['reviews', storyId] as const,
        rating: (storyId: string) => ['reviews', storyId, 'rating'] as const,
    },
};

// Story Hooks
export const useStories = () => {
    return useQuery({
        queryKey: queryKeys.stories.all,
        queryFn: () => sanityClient.fetch(queries.allStories),
        staleTime: 60 * 60 * 1000, // 1 hour
    });
};

export const useFeaturedStories = () => {
    return useQuery({
        queryKey: queryKeys.stories.featured,
        queryFn: () => sanityClient.fetch(queries.featuredStories),
        staleTime: 60 * 60 * 1000, // 1 hour
    });
};

export const useDailyPick = () => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    return useQuery({
        queryKey: ['stories', 'dailyPick', today],
        queryFn: () => sanityClient.fetch(queries.dailyPick, { today }),
        staleTime: 60 * 60 * 1000, // 1 hour - refetch periodically
    });
};

export const useStory = (id: string) => {
    return useQuery({
        queryKey: queryKeys.stories.byId(id),
        queryFn: () => sanityClient.fetch(queries.storyById, { id }),
        enabled: !!id,
        staleTime: 24 * 60 * 60 * 1000, // 24 hours
    });
};

export const useStoryBySlug = (slug: string) => {
    return useQuery({
        queryKey: queryKeys.stories.bySlug(slug),
        queryFn: () => sanityClient.fetch(queries.storyBySlug, { slug }),
        enabled: !!slug,
        staleTime: 24 * 60 * 60 * 1000, // 24 hours
    });
};

export const useStoriesByCategory = (categoryId: string) => {
    return useQuery({
        queryKey: queryKeys.stories.byCategory(categoryId),
        queryFn: () => sanityClient.fetch(queries.storiesByCategory, { categoryId }),
        enabled: !!categoryId,
        staleTime: 60 * 60 * 1000, // 1 hour
    });
};

export const useSearchStories = (query: string) => {
    return useQuery({
        queryKey: queryKeys.stories.search(query),
        queryFn: () => sanityClient.fetch(queries.searchStories, { query: `*${query}*` } as any),
        enabled: query.length >= 2,
        staleTime: 2 * 60 * 1000, // 2 minutes for search
    });
};

// Author Hooks
export const useAuthors = () => {
    return useQuery({
        queryKey: queryKeys.authors.all,
        queryFn: () => sanityClient.fetch(queries.allAuthors),
        staleTime: 60 * 60 * 1000, // 1 hour
    });
};

export const useFeaturedAuthor = () => {
    return useQuery({
        queryKey: queryKeys.authors.featured,
        queryFn: () => sanityClient.fetch(queries.featuredAuthor),
        staleTime: 24 * 60 * 60 * 1000, // 24 hours
    });
};

export const useAuthor = (id: string) => {
    return useQuery({
        queryKey: queryKeys.authors.byId(id),
        queryFn: () => sanityClient.fetch(queries.authorById, { id }),
        enabled: !!id,
        staleTime: 60 * 60 * 1000, // 1 hour
    });
};

// Category Hooks
export const useCategories = () => {
    return useQuery({
        queryKey: queryKeys.categories.all,
        queryFn: () => sanityClient.fetch(queries.allCategories),
        staleTime: 24 * 60 * 60 * 1000, // 24 hours
    });
};

// Review Hooks
export const useReviewsByStory = (storyId: string) => {
    return useQuery({
        queryKey: queryKeys.reviews.byStory(storyId),
        queryFn: () => sanityClient.fetch(queries.reviewsByStory, { storyId }),
        enabled: !!storyId,
        staleTime: 2 * 60 * 1000,
    });
};

export const useStoryRating = (storyId: string) => {
    return useQuery({
        queryKey: queryKeys.reviews.rating(storyId),
        queryFn: () => sanityClient.fetch(queries.storyRating, { storyId }),
        enabled: !!storyId,
        staleTime: 5 * 60 * 1000,
    });
};

// Create Review Mutation
export const useCreateReview = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (review: {
            storyId: string;
            userId: string;
            userName: string;
            userAvatar?: string;
            rating: number;
            text: string;
        }) => {
            const doc = {
                _type: 'review',
                story: { _type: 'reference', _ref: review.storyId },
                userId: review.userId,
                userName: review.userName,
                userAvatar: review.userAvatar,
                rating: review.rating,
                text: review.text,
                isApproved: false, // Requires admin approval
                createdAt: new Date().toISOString(),
            };

            return sanityWriteClient.create(doc);
        },
        onSuccess: (_, variables) => {
            // Invalidate review queries for this story
            queryClient.invalidateQueries({
                queryKey: queryKeys.reviews.byStory(variables.storyId),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.reviews.rating(variables.storyId),
            });
        },
    });
};
