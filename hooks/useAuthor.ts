import { useState, useEffect, useCallback } from 'react';
import { authorService } from '@/services/authorService';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import { haptics } from '@/utils/haptics';

export const useAuthorSocial = (authorId: string, authorName: string) => {
    const { user } = useAuthStore();
    const toast = useToastStore();

    const [isFollowing, setIsFollowing] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchData = useCallback(async () => {
        if (!authorId) return;
        setLoading(true);

        try {
            const [followStatus, count] = await Promise.all([
                user ? authorService.isFollowingAuthor(user.id, authorId) : Promise.resolve({ success: true, data: false }),
                authorService.getAuthorFollowerCount(authorId)
            ]);

            if (followStatus.success) {
                setIsFollowing(followStatus.data);
            }
            setFollowerCount(count);
        } catch (error) {
            console.error('Error fetching author data:', error);
        } finally {
            setLoading(false);
        }
    }, [authorId, user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFollowToggle = async () => {
        if (!user) {
            toast.actions.error('Please login to follow authors');
            return;
        }

        setActionLoading(true);
        haptics.selection();

        if (isFollowing) {
            const res = await authorService.unfollowAuthor(user.id, authorId);
            if (res.success) {
                setIsFollowing(false);
                setFollowerCount(prev => Math.max(0, prev - 1));
                toast.actions.success(`Unfollowed ${authorName}`);
            } else {
                toast.actions.error('Failed to unfollow');
            }
        } else {
            const res = await authorService.followAuthor(
                user.id,
                user.displayName || 'Anonymous',
                user.photoURL,
                authorId,
                authorName
            );
            if (res.success) {
                setIsFollowing(true);
                setFollowerCount(prev => prev + 1);
                toast.actions.success(`Following ${authorName}`);
            } else {
                toast.actions.error('Failed to follow');
            }
        }
        setActionLoading(false);
    };

    return {
        isFollowing,
        followerCount,
        loading,
        actionLoading,
        handleFollowToggle,
        refresh: fetchData,
    };
};
