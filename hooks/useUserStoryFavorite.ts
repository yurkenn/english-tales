import { useState, useCallback, useEffect } from 'react';
import { userStoryFavoriteService } from '@/services/userStoryFavoriteService';
import { useAuthStore } from '@/store/authStore';

interface UseUserStoryFavoriteResult {
    isFavorited: boolean;
    favoriteCount: number;
    isLoading: boolean;
    toggleFavorite: () => Promise<void>;
}

export function useUserStoryFavorite(storyId: string | undefined): UseUserStoryFavoriteResult {
    const { user } = useAuthStore();
    const [isFavorited, setIsFavorited] = useState(false);
    const [favoriteCount, setFavoriteCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!storyId) return;

        const loadData = async () => {
            setIsLoading(true);
            try {
                const [favStatus, count] = await Promise.all([
                    user ? userStoryFavoriteService.isFavorited(storyId, user.id) : Promise.resolve(false),
                    userStoryFavoriteService.getFavoriteCount(storyId),
                ]);
                setIsFavorited(favStatus);
                setFavoriteCount(count);
            } catch (error) {
                console.error('Error loading favorite data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [storyId, user]);

    const toggleFavorite = useCallback(async () => {
        if (!storyId || !user) return;

        const newStatus = await userStoryFavoriteService.toggleFavorite(storyId, user.id);
        setIsFavorited(newStatus);
        setFavoriteCount((prev) => (newStatus ? prev + 1 : Math.max(0, prev - 1)));
    }, [storyId, user]);

    return {
        isFavorited,
        favoriteCount,
        isLoading,
        toggleFavorite,
    };
}
