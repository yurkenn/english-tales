/**
 * Sanity Mutations for User Stories
 * 
 * This module provides functions to create, update, and delete user-generated stories
 * in the Sanity CMS. All mutations require authentication.
 */

import { sanityWriteClient } from './client';
import { UserStory, CreateUserStoryInput, UpdateUserStoryInput } from '@/store/userStoryStore';

// Use write client for mutations
const client = sanityWriteClient;

/**
 * Create a new user story draft
 */
export async function createUserStory(
    authorId: string,
    authorName: string,
    authorAvatar: string | undefined,
    input: CreateUserStoryInput
): Promise<UserStory> {
    const doc = {
        _type: 'userStory',
        authorId,
        authorName,
        authorAvatar: authorAvatar || null,
        title: input.title,
        description: input.description,
        content: input.content,
        difficulty: input.difficulty,
        categories: input.categoryIds.map(id => ({
            _type: 'reference',
            _ref: id,
            _key: id,
        })),
        status: input.status || 'draft',
        isPublished: false,
        submittedAt: input.status === 'pending' ? new Date().toISOString() : null,
    };

    // Add cover image if provided
    if (input.coverImageAssetId) {
        (doc as any).coverImage = {
            _type: 'image',
            asset: {
                _type: 'reference',
                _ref: input.coverImageAssetId,
            },
        };
    }

    const result = await client.create(doc);
    return result as unknown as UserStory;
}

/**
 * Update an existing user story
 */
export async function updateUserStory(
    id: string,
    input: UpdateUserStoryInput
): Promise<UserStory> {
    const patch = client.patch(id);

    if (input.title !== undefined) {
        patch.set({ title: input.title });
    }
    if (input.description !== undefined) {
        patch.set({ description: input.description });
    }
    if (input.content !== undefined) {
        patch.set({ content: input.content });
    }
    if (input.difficulty !== undefined) {
        patch.set({ difficulty: input.difficulty });
    }
    if (input.categoryIds !== undefined) {
        patch.set({
            categories: input.categoryIds.map(id => ({
                _type: 'reference',
                _ref: id,
                _key: id,
            })),
        });
    }
    if (input.coverImageAssetId !== undefined) {
        patch.set({
            coverImage: {
                _type: 'image',
                asset: {
                    _type: 'reference',
                    _ref: input.coverImageAssetId,
                },
            },
        });
    }
    if (input.status !== undefined) {
        patch.set({ status: input.status });
        // If submitting for review, update submittedAt
        if (input.status === 'pending') {
            patch.set({ submittedAt: new Date().toISOString() });
        }
    }

    const result = await patch.commit();
    return result as unknown as UserStory;
}

/**
 * Delete a user story (only drafts can be deleted by users)
 */
export async function deleteUserStory(id: string): Promise<void> {
    await client.delete(id);
}

/**
 * Submit a story for review
 */
export async function submitStoryForReview(id: string): Promise<UserStory> {
    const result = await client
        .patch(id)
        .set({
            status: 'pending',
            submittedAt: new Date().toISOString(),
        })
        .commit();

    return result as unknown as UserStory;
}

/**
 * Revert story to draft (after rejection/revision request)
 */
export async function revertToDraft(id: string): Promise<UserStory> {
    const result = await client
        .patch(id)
        .set({
            status: 'draft',
            reviewerNotes: null,
        })
        .commit();

    return result as unknown as UserStory;
}

/**
 * Upload an image asset to Sanity
 */
export async function uploadImageAsset(
    imageUri: string,
    filename: string
): Promise<string> {
    // Fetch the image as a blob
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Upload to Sanity
    const asset = await client.assets.upload('image', blob, {
        filename,
        contentType: blob.type || 'image/jpeg',
    });

    return asset._id;
}
