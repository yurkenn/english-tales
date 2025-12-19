import { useState, useCallback, useEffect } from 'react';
import { reviewService } from '@/services/reviewService';
import { UserFavorite } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import { haptics } from '@/utils/haptics';

export const useFavorites = (storyId?: string) => {
    const { user } = useAuthStore();
    const [isFavorited, setIsFavorited] = useState(false);
    const [favorites, setFavorites] = useState<UserFavorite[]>([]);
    const [loading, setLoading] = useState(false);
    const toast = useToastStore(s => s.actions);

    const checkStatus = useCallback(async () => {
        if (!user || !storyId) return;
        const result = await reviewService.isFavorited(user.id, storyId);
        if (result.success) {
            setIsFavorited(result.data);
        }
    }, [user, storyId]);

    const fetchFavorites = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const result = await reviewService.getUserFavorites(user.id);
        if (result.success) {
            setFavorites(result.data);
        }
        setLoading(false);
    }, [user]);

    useEffect(() => {
        if (storyId) checkStatus();
        fetchFavorites();
    }, [storyId, checkStatus, fetchFavorites]);

    const toggleFavorite = async (storyTitle: string, storyCover: string) => {
        if (!user || !storyId) return;

        haptics.selection();
        const result = await reviewService.toggleFavorite(
            user.id,
            storyId,
            storyTitle,
            storyCover
        );

        if (result.success) {
            setIsFavorited(result.data);
            if (result.data) {
                haptics.success();
                toast.success('Added to favorites!');
            } else {
                toast.success('Removed from favorites');
            }
            fetchFavorites();
        } else {
            toast.error('Failed to update favorite');
        }
    };

    return {
        isFavorited,
        favorites,
        loading,
        toggleFavorite,
        refresh: fetchFavorites,
    };
};
