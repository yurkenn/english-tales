import { useMemo } from 'react';
import { Story, LibraryItem, ReadingProgress } from '@/types';
import { useSettingsStore } from '@/store/settingsStore';

export const useRecommendations = (
    allStories: Story[],
    libraryItems: LibraryItem[],
    progressMap: Record<string, ReadingProgress>
) => {
    const { settings } = useSettingsStore();
    const userLevel = settings.proficiencyLevel || 'intermediate';

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
            // If all stories are read, prioritize by level then return
            return allStories
                .filter(s => s.difficulty === userLevel)
                .slice(0, 10)
                .concat(allStories.filter(s => s.difficulty !== userLevel).slice(0, 5));
        }

        // 5. Score unread stories based on category overlap AND proficiency level
        const scoredStories = unreadStories.map(story => {
            let score = 0;

            // Proficiency level matching (highest priority)
            if (story.difficulty === userLevel) {
                score += 20; // Big boost for matching level
            } else if (
                (userLevel === 'intermediate' && story.difficulty === 'beginner') ||
                (userLevel === 'intermediate' && story.difficulty === 'advanced') ||
                (userLevel === 'beginner' && story.difficulty === 'intermediate') ||
                (userLevel === 'advanced' && story.difficulty === 'intermediate')
            ) {
                score += 5; // Small boost for adjacent levels
            }

            // Category overlap
            story.tags?.forEach(tag => {
                if (preferredCategories.includes(tag)) {
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
    }, [allStories, libraryItems, progressMap, userLevel]);
};
