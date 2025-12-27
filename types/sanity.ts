// TypeScript types for Sanity data
import type { PortableTextBlock } from '@portabletext/types';

export interface QuizQuestion {
    question: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
}

// Base Sanity document
export interface SanityDocument {
    _id: string;
    _type: string;
    _createdAt?: string;
    _updatedAt?: string;
}

// Sanity image reference
export interface SanityImage {
    _type: 'image';
    asset: {
        _ref: string;
        _type: 'reference';
    };
    hotspot?: {
        x: number;
        y: number;
        height: number;
        width: number;
    };
}

// Sanity slug
export interface SanitySlug {
    _type: 'slug';
    current: string;
}

// Author
export interface Author extends SanityDocument {
    _type: 'author';
    name: string;
    slug?: SanitySlug;
    image?: SanityImage;
    bio?: string;
    nationality?: string;
    birthYear?: number;
    deathYear?: number;
    isFeatured?: boolean;
}

// Category
export interface Category extends SanityDocument {
    _type: 'category';
    title: string;
    slug: SanitySlug;
    description?: string;
    icon?: string;
    color?: string;
    order?: number;
    storyCount?: number;
}

// Story
export interface Story extends SanityDocument {
    _type: 'story';
    title: string;
    slug: SanitySlug;
    author: Author;
    coverImage: SanityImage;
    description: string;
    content?: PortableTextBlock[];
    categories: Category[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedReadTime: number;
    wordCount: number;
    isFeatured?: boolean;
    isPremiumOnly?: boolean;
    publishedAt?: string;
    quiz?: QuizQuestion[];
}

// Review
export interface Review extends SanityDocument {
    _type: 'review';
    story: { _ref: string };
    userId: string;
    userName: string;
    userAvatar?: string;
    rating: number;
    text: string;
    isApproved: boolean;
    createdAt: string;
}

// Story Rating
export interface StoryRating {
    averageRating: number | null;
    totalReviews: number;
}

// Featured Author with story count
export interface FeaturedAuthor extends Author {
    storyCount: number;
}

// Reading Progress (local storage)
export interface ReadingProgress {
    storyId: string;
    currentPage: number;
    totalPages: number;
    percentage: number;
    lastReadAt: Date;
}

// Library Item
export interface LibraryItem {
    storyId: string;
    story: Story;
    addedAt: Date;
    progress?: ReadingProgress;
    isCompleted: boolean;
}
