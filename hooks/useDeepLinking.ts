/**
 * Deep Linking Hook
 * Handles incoming URLs and navigates to appropriate screens
 * 
 * URL Schemes:
 * - english-tales://story/{id} - Opens story detail
 * - english-tales://profile/{id} - Opens user profile
 * - english-tales://reading/{id} - Opens reading screen
 */

import { useEffect, useCallback } from 'react';
import { Linking } from 'react-native';
import { useRouter } from 'expo-router';

interface ParsedDeepLink {
    type: 'story' | 'profile' | 'reading' | 'unknown';
    id?: string;
    params?: Record<string, string>;
}

export function useDeepLinking() {
    const router = useRouter();

    const parseUrl = useCallback((url: string): ParsedDeepLink => {
        try {
            // Handle both custom scheme and universal links
            // english-tales://story/123 or https://englishtales.app/story/123
            const cleanUrl = url
                .replace('english-tales://', '')
                .replace('https://englishtales.app/', '');

            const [path, queryString] = cleanUrl.split('?');
            const segments = path.split('/').filter(Boolean);

            // Parse query params
            const params: Record<string, string> = {};
            if (queryString) {
                queryString.split('&').forEach(pair => {
                    const [key, value] = pair.split('=');
                    if (key && value) {
                        params[decodeURIComponent(key)] = decodeURIComponent(value);
                    }
                });
            }

            if (segments[0] === 'story' && segments[1]) {
                return { type: 'story', id: segments[1], params };
            }

            if (segments[0] === 'profile' && segments[1]) {
                return { type: 'profile', id: segments[1], params };
            }

            if (segments[0] === 'reading' && segments[1]) {
                return { type: 'reading', id: segments[1], params };
            }

            return { type: 'unknown', params };
        } catch (error) {
            console.warn('[DeepLink] Failed to parse URL:', url, error);
            return { type: 'unknown' };
        }
    }, []);

    const handleDeepLink = useCallback((url: string | null) => {
        if (!url) return;

        const parsed = parseUrl(url);

        switch (parsed.type) {
            case 'story':
                router.push(`/story/${parsed.id}`);
                break;
            case 'profile':
                router.push(`/user/${parsed.id}`);
                break;
            case 'reading':
                router.push(`/reading/${parsed.id}`);
                break;
            default:
                // Unknown deep link - just log it
                if (__DEV__) {
                    console.log('[DeepLink] Unknown URL:', url);
                }
        }
    }, [router, parseUrl]);

    useEffect(() => {
        // Handle initial URL (app opened via deep link)
        const getInitialUrl = async () => {
            const initialUrl = await Linking.getInitialURL();
            if (initialUrl) {
                handleDeepLink(initialUrl);
            }
        };

        getInitialUrl();

        // Handle URLs when app is already open
        const subscription = Linking.addEventListener('url', (event) => {
            handleDeepLink(event.url);
        });

        return () => {
            subscription.remove();
        };
    }, [handleDeepLink]);

    // Utility function to create shareable links
    const createShareableLink = useCallback((type: 'story' | 'profile', id: string): string => {
        return `https://englishtales.app/${type}/${id}`;
    }, []);

    return {
        createShareableLink,
    };
}
