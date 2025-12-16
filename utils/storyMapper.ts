import { urlFor } from '@/services/sanity/client';
import { Story as AppStory } from '@/types';
import type { Story as SanityStory, Category } from '@/types/sanity';

/**
 * Maps a Sanity document to the Story type.
 * Centralizes the transformation logic for story data.
 */
export const mapSanityStory = (doc: SanityStory): AppStory => ({
    id: doc._id,
    title: doc.title,
    description: doc.description,
    content: Array.isArray(doc.content) ? JSON.stringify(doc.content) : (doc.content || ''),
    coverImage: doc.coverImage ? urlFor(doc.coverImage).width(500).url() : '',
    author: doc.author?.name || 'Unknown Author',
    difficulty: doc.difficulty || 'intermediate',
    estimatedReadTime: doc.estimatedReadTime || 5,
    wordCount: doc.wordCount || 1000,
    tags: doc.categories?.map((c: Category) => c.title) || [],
    createdAt: new Date(doc.publishedAt || doc._createdAt || new Date()),
    updatedAt: new Date(doc.publishedAt || doc._updatedAt || new Date()),
});

/**
 * Maps an array of Sanity documents to Story array.
 */
export const mapSanityStories = (docs: SanityStory[]): AppStory[] => {
    return docs?.map(mapSanityStory) || [];
};
