import { urlFor } from '@/services/sanity/client';
import { Story } from '@/types';

/**
 * Maps a Sanity document to the Story type.
 * Centralizes the transformation logic for story data.
 */
export const mapSanityStory = (doc: any): Story => ({
    id: doc._id,
    title: doc.title,
    description: doc.description,
    content: doc.content || '',
    coverImage: doc.coverImage ? urlFor(doc.coverImage).width(500).url() : '',
    coverImageLqip: doc.coverImageLqip,
    author: doc.author?.name || 'Unknown Author',
    authorId: doc.author?._id,
    difficulty: doc.difficulty || 'intermediate',
    estimatedReadTime: doc.estimatedReadTime || 5,
    wordCount: doc.wordCount || 1000,
    tags: doc.categories?.map((c: any) => c.title) || [],
    createdAt: new Date(doc.publishedAt || new Date()),
    updatedAt: new Date(doc.publishedAt || new Date()),
    isPremiumOnly: doc.isPremiumOnly || false,
});

/**
 * Maps an array of Sanity documents to Story array.
 */
export const mapSanityStories = (docs: any[]): Story[] => {
    return docs?.map(mapSanityStory) || [];
};
