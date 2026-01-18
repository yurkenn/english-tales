import { useEffect } from 'react';
import { useLocalSearchParams, useRouter, Redirect } from 'expo-router';

/**
 * This route redirects to the unified reading screen
 * Community stories now use: /reading/[id]?source=community
 */
export default function UserStoryReadingRedirect() {
    const { id } = useLocalSearchParams<{ id: string }>();

    // Redirect to unified reading screen with source=community
    return <Redirect href={`/reading/${id}?source=community` as any} />;
}
