import { useMemo } from 'react';
import { useStory, useUserStory } from '@/hooks/useQueries';
import { PortableTextBlock } from '@portabletext/types';
import type { QuizQuestion } from '@/types/sanity';

export type StorySource = 'sanity' | 'community';

export interface UnifiedStoryData {
    id: string;
    title: string;
    content: PortableTextBlock[] | undefined;
    coverImage?: string;
    author?: string;
    authorId?: string;
    description?: string;
    estimatedReadTime: number;
    wordCount: number;
    level?: string;
    difficulty?: string;
    quiz?: QuizQuestion[];
    hasQuiz: boolean;
    source: StorySource;
}

interface UseUnifiedStoryDataResult {
    story: UnifiedStoryData | null;
    isLoading: boolean;
    error: Error | null;
}

/**
 * Unified hook to load either Sanity stories or community stories
 * Returns a consistent interface regardless of source
 */
export function useUnifiedStoryData(
    storyId: string | undefined,
    source: StorySource
): UseUnifiedStoryDataResult {
    // Sanity story query
    const sanityQuery = useStory(source === 'sanity' ? storyId || '' : '');

    // Community story query
    const communityQuery = useUserStory(source === 'community' ? storyId : undefined);

    const result = useMemo<UseUnifiedStoryDataResult>(() => {
        if (!storyId) {
            return { story: null, isLoading: false, error: null };
        }

        if (source === 'sanity') {
            if (sanityQuery.isLoading) {
                return { story: null, isLoading: true, error: null };
            }

            if (sanityQuery.error || !sanityQuery.data) {
                return {
                    story: null,
                    isLoading: false,
                    error: sanityQuery.error as Error | null,
                };
            }

            const doc = sanityQuery.data;
            return {
                story: {
                    id: storyId,
                    title: doc.title,
                    content: doc.content as PortableTextBlock[] | undefined,
                    coverImage: doc.coverImage?.asset?.url,
                    author: doc.author?.name,
                    description: doc.description,
                    estimatedReadTime: doc.estimatedReadTime || 5,
                    wordCount: doc.wordCount || 0,
                    level: doc.level,
                    quiz: doc.quiz,
                    hasQuiz: !!(doc.quiz && doc.quiz.length > 0),
                    source: 'sanity',
                },
                isLoading: false,
                error: null,
            };
        }

        // Community story
        if (communityQuery.isLoading) {
            return { story: null, isLoading: true, error: null };
        }

        if (communityQuery.error || !communityQuery.data) {
            return {
                story: null,
                isLoading: false,
                error: communityQuery.error as Error | null,
            };
        }

        const doc = communityQuery.data;

        // Convert community story content to PortableTextBlock format
        const portableContent: PortableTextBlock[] | undefined = doc.content
            ? (doc.content as any[])
                .filter((block: any) => block._type === 'block' && block.children)
                .map((block: any) => ({
                    _type: 'block' as const,
                    _key: block._key || Math.random().toString(36).substr(2, 9),
                    style: block.style || 'normal',
                    markDefs: block.markDefs || [],
                    children: block.children.map((child: any) => ({
                        _type: 'span' as const,
                        _key: child._key || Math.random().toString(36).substr(2, 9),
                        text: child.text || '',
                        marks: child.marks || [],
                    })),
                }))
            : undefined;

        return {
            story: {
                id: storyId,
                title: doc.title,
                content: portableContent,
                coverImage: doc.coverImage,
                author: doc.authorName,
                authorId: doc.authorId,
                description: doc.description,
                estimatedReadTime: doc.wordCount ? Math.ceil(doc.wordCount / 200) : 5,
                wordCount: doc.wordCount || 0,
                difficulty: doc.difficulty,
                quiz: undefined,
                hasQuiz: false,
                source: 'community',
            },
            isLoading: false,
            error: null,
        };
    }, [storyId, source, sanityQuery, communityQuery]);

    return result;
}
