import { createClient } from '@sanity/client';
import { createImageUrlBuilder } from '@sanity/image-url';

// Sanity configuration
const projectId = process.env.EXPO_PUBLIC_SANITY_PROJECT_ID!;
const dataset = process.env.EXPO_PUBLIC_SANITY_DATASET || 'production';
const apiVersion = '2024-01-01';

// Create Sanity client
export const sanityClient = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: true, // Use CDN for faster reads
    // token is optional for public datasets
    token: process.env.EXPO_PUBLIC_SANITY_TOKEN,
});

// Sanity client for mutations (no CDN)
export const sanityWriteClient = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: process.env.EXPO_PUBLIC_SANITY_TOKEN,
});

// Image URL builder
const builder = createImageUrlBuilder(sanityClient);

export const urlFor = (source: any) => {
    return builder.image(source);
};

// Helper to get optimized image URL
export const getImageUrl = (
    source: any,
    options?: {
        width?: number;
        height?: number;
        quality?: number;
    }
) => {
    let imageBuilder = builder.image(source);

    if (options?.width) {
        imageBuilder = imageBuilder.width(options.width);
    }
    if (options?.height) {
        imageBuilder = imageBuilder.height(options.height);
    }
    if (options?.quality) {
        imageBuilder = imageBuilder.quality(options.quality);
    }

    return imageBuilder.auto('format').url();
};
