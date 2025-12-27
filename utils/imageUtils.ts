import { urlFor } from '@/services/sanity';

/**
 * Optimizes a Sanity image URI or object.
 * Returns a string URL with dimensions, format, and quality parameters.
 */
export const getOptimizedUri = (
    uri: string | any,
    options?: { width?: number; height?: number }
): string => {
    if (!uri) return '';

    let optimizedUri = '';
    const { width, height } = options || {};

    if (typeof uri === 'string') {
        if (!uri.includes('cdn.sanity.io')) return uri;
        optimizedUri = uri;
    } else if (uri._type === 'image' || (uri.asset && uri.asset._ref)) {
        // Handle Sanity image object
        try {
            optimizedUri = urlFor(uri).url();
        } catch (e) {
            console.warn('[imageUtils] Failed to generate URL from Sanity object:', e);
            return '';
        }
    } else {
        return '';
    }

    const separator = optimizedUri.includes('?') ? '&' : '?';
    let finalUri = optimizedUri;

    if (width) {
        finalUri += `${finalUri.includes('?') ? '&' : '?'}w=${Math.round(width * 2)}`; // 2x for retina
    }
    if (height) {
        finalUri += `${finalUri.includes('?') ? '&' : '?'}h=${Math.round(height * 2)}`;
    }

    // Add auto format and quality
    finalUri += `${finalUri.includes('?') ? '&' : '?'}auto=format&q=75`;

    return finalUri;
};
