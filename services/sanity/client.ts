import { createClient } from '@sanity/client';
import { createImageUrlBuilder } from '@sanity/image-url';

// Sanity configuration
const projectId = process.env.EXPO_PUBLIC_SANITY_PROJECT_ID!;
const dataset = process.env.EXPO_PUBLIC_SANITY_DATASET || 'production';
const apiVersion = '2024-01-01';

// Create Sanity client (read-only, no token needed for public datasets)
export const sanityClient = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: true, // Use CDN for faster reads
    // No token - public dataset, read-only access
    // Write operations should only be done via blue-hare scripts with proper token
});

// Legacy alias for backwards compatibility (read-only)
export const sanityWriteClient = sanityClient;

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
