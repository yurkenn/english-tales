import { useState, useEffect, useCallback } from 'react';
import { communityService } from '@/services/communityService';
import { CommunityPost, CommunityReply } from '@/types';
import { useToastStore } from '@/store/toastStore';
import { haptics } from '@/utils/haptics';

export const useCommunityPost = (postId: string) => {
    const [post, setPost] = useState<CommunityPost | null>(null);
    const [replies, setReplies] = useState<CommunityReply[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const toast = useToastStore(s => s.actions);

    const fetchData = useCallback(async (isRefresh = false) => {
        if (!postId) return;
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const [postResult, repliesResult] = await Promise.all([
                communityService.getPostById(postId),
                communityService.getReplies(postId)
            ]);

            if (postResult.success) {
                setPost(postResult.data);
            }

            if (repliesResult.success) {
                setReplies(repliesResult.data);
            }
        } catch (error) {
            console.error('Error fetching post detail:', error);
            toast.error('Failed to load post');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [postId, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleToggleLike = async (userId: string, userName: string, userPhoto: string | null) => {
        if (!post) return;
        haptics.selection();

        const result = await communityService.toggleLike(post.id, userId, userName, userPhoto);
        if (result.success) {
            // Optimistic update or refresh
            fetchData();
        }
    };

    const handleAddReply = async (userId: string, userName: string, userPhoto: string | null, content: string) => {
        if (!post) return;
        haptics.success();

        const result = await communityService.addReply(post.id, userId, userName, userPhoto, content);
        if (result.success) {
            toast.success('Reply added!');
            fetchData();
            return true;
        } else {
            toast.error('Failed to add reply');
            return false;
        }
    };

    return {
        post,
        replies,
        loading,
        refreshing,
        handleRefresh: () => fetchData(true),
        handleToggleLike,
        handleAddReply,
    };
};
