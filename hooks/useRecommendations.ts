import { useMemo } from 'react';
import { Story, LibraryItem, ReadingProgress } from '@/types';

export const useRecommendations = (
    allStories: Story[],
    libraryItems: LibraryItem[],
    progressMap: Record<string, ReadingProgress>
) => {
    return useMemo(() => {
        if (!allStories.length) return [];

        // 1. Get IDs of stories already read or in library
        const readStoryIds = new Set(libraryItems.map(item => item.storyId));

        // 2. Identify preferred categories
        const categoryCounts: Record<string, number> = {};
        libraryItems.forEach(item => {
            item.story.tags?.forEach(tag => {
                categoryCounts[tag] = (categoryCounts[tag] || 0) + 1;
            });
        });

        // 3. Sort categories by preference
        const preferredCategories = Object.entries(categoryCounts)
            .sort(([, a], [, b]) => b - a)
            .map(([tag]) => tag);

        // 4. Filter out already read stories
        const unreadStories = allStories.filter(story => !readStoryIds.has(story.id));

        if (unreadStories.length === 0) {
            // If all stories are read, just return some popular/recent ones
            return allStories.slice(0, 10);
        }

        // 5. Score unread stories based on category overlap
        const scoredStories = unreadStories.map(story => {
            let score = 0;
            story.tags?.forEach(tag => {
                if (preferredCategories.includes(tag)) {
                    // Higher weight for top categories
                    const preferenceIndex = preferredCategories.indexOf(tag);
                    score += Math.max(0, 10 - preferenceIndex);
                }
            });
            return { story, score };
        });

        // 6. Sort by score and return top recommendations
        return scoredStories
            .sort((a, b) => b.score - a.score)
            .map(item => item.story);
    }, [allStories, libraryItems, progressMap]);
};
