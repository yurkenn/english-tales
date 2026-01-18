import { useState, useCallback, useEffect } from 'react';
import { authorFollowService } from '@/services/authorFollowService';
import { useAuthStore } from '@/store/authStore';

interface UseAuthorFollowResult {
    isFollowing: boolean;
    followerCount: number;
    isLoading: boolean;
    toggleFollow: () => Promise<void>;
}

export function useAuthorFollow(authorId: string | undefined): UseAuthorFollowResult {
    const { user } = useAuthStore();
    const [isFollowing, setIsFollowing] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!authorId) return;

        const loadData = async () => {
            setIsLoading(true);
            try {
                const [followStatus, count] = await Promise.all([
                    user ? authorFollowService.isFollowing(authorId, user.id) : Promise.resolve(false),
                    authorFollowService.getFollowerCount(authorId),
                ]);
                setIsFollowing(followStatus);
                setFollowerCount(count);
            } catch (error) {
                console.error('Error loading follow data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [authorId, user]);

    const toggleFollow = useCallback(async () => {
        if (!authorId || !user) return;

        const newStatus = await authorFollowService.toggleFollow(authorId, user.id);
        setIsFollowing(newStatus);
        setFollowerCount((prev) => (newStatus ? prev + 1 : Math.max(0, prev - 1)));
    }, [authorId, user]);

    return {
        isFollowing,
        followerCount,
        isLoading,
        toggleFollow,
    };
}
