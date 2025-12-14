import { z } from 'zod';

// Review form schema
export const reviewSchema = z.object({
    rating: z
        .number()
        .min(1, 'Please select a rating')
        .max(5, 'Rating must be between 1 and 5'),
    text: z
        .string()
        .min(10, 'Review must be at least 10 characters')
        .max(1000, 'Review must be less than 1000 characters'),
});

export type ReviewFormData = z.infer<typeof reviewSchema>;

// User profile schema
export const userProfileSchema = z.object({
    displayName: z
        .string()
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name must be less than 50 characters'),
    email: z
        .string()
        .email('Please enter a valid email'),
    photoURL: z
        .string()
        .url('Please enter a valid URL')
        .optional()
        .or(z.literal('')),
});

export type UserProfileFormData = z.infer<typeof userProfileSchema>;

// Search schema
export const searchSchema = z.object({
    query: z
        .string()
        .min(2, 'Search query must be at least 2 characters')
        .max(100, 'Search query must be less than 100 characters'),
});

export type SearchFormData = z.infer<typeof searchSchema>;

// Reading progress schema
export const readingProgressSchema = z.object({
    storyId: z.string(),
    currentPage: z.number().min(0),
    totalPages: z.number().min(1),
    lastReadAt: z.date(),
});

export type ReadingProgressData = z.infer<typeof readingProgressSchema>;
