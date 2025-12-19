import { useState, useCallback, useEffect } from 'react';
import { communityService } from '@/services/communityService';
import { socialService } from '@/services/socialService';
import { CommunityPost, ActivityType } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import { haptics } from '@/utils/haptics';

export type FeedFilter = 'all' | 'following';

export const useCommunityFeed = () => {
    const { user } = useAuthStore();
    const toast = useToastStore(s => s.actions);

    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastDoc, setLastDoc] = useState<any>(null);
    const [hasMore, setHasMore] = useState(true);
    const [filter, setFilter] = useState<FeedFilter>('all');
    const [followingIds, setFollowingIds] = useState<string[]>([]);

    const fetchPosts = useCallback(async (isRefreshing = false) => {
        if (isRefreshing) {
            setRefreshing(true);
        } else if (lastDoc) {
            setLoadingMore(true);
        } else {
            setLoading(true);
        }

        let result;
        if (filter === 'following' && user) {
            // Fetch following IDs first if not available
            let ids = followingIds;
            if (isRefreshing || ids.length === 0) {
                const followResult = await socialService.getFollowingIds(user.id);
                if (followResult.success) {
                    ids = [...followResult.data, user.id];
                    setFollowingIds(ids);
                }
            }
            result = await communityService.getFollowingPosts(ids, 15, isRefreshing ? null : lastDoc);
        } else {
            result = await communityService.getPosts(15, isRefreshing ? null : lastDoc);
        }

        if (result.success) {
            if (isRefreshing) {
                setPosts(result.data.posts);
            } else {
                setPosts(prev => [...prev, ...result.data.posts]);
            }
            setLastDoc(result.data.lastVisible);
            setHasMore(result.data.posts.length === 15);
        } else {
            toast.error(result.error || 'Failed to fetch posts');
        }

        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
    }, [lastDoc, toast]);

    const handleFilterChange = (newFilter: FeedFilter) => {
        setFilter(newFilter);
        setLastDoc(null);
        setPosts([]);
    };

    useEffect(() => {
        fetchPosts(true);
    }, [filter]); // Removed fetchPosts to avoid infinite loop on state update

    const handleRefresh = useCallback(() => {
        setLastDoc(null);
        fetchPosts(true);
    }, [fetchPosts]);

    const handleLoadMore = useCallback(() => {
        if (!loadingMore && hasMore && lastDoc) {
            fetchPosts();
        }
    }, [loadingMore, hasMore, lastDoc, fetchPosts]);

    const handleCreatePost = async (content: string, type: ActivityType = 'thought', metadata?: any) => {
        if (!user) return;
        if (!content.trim()) return;

        haptics.success();
        const result = await communityService.createPost(
            user.id,
            user.displayName || 'Anonymous',
            user.photoURL,
            content,
            type,
            metadata
        );

        if (result.success) {
            toast.success('Post shared!');

            // Optimistic update
            const newPost: CommunityPost = {
                id: result.data,
                userId: user.id,
                userName: user.displayName || 'Anonymous',
                userPhoto: user.photoURL,
                content,
                type,
                metadata: metadata || {},
                timestamp: { toDate: () => new Date() }, // Mock Firestore timestamp
                likes: 0,
                likedBy: [],
                replyCount: 0,
            };
            setPosts(prev => [newPost, ...prev]);
            return true;
        } else {
            toast.error(result.error || 'Failed to share post');
            return false;
        }
    };

    const handleToggleLike = async (postId: string) => {
        if (!user) {
            toast.info('Please sign in to like posts');
            return;
        }

        haptics.selection();

        // Optimistic update
        setPosts(prev => prev.map(p => {
            if (p.id === postId) {
                const hasLiked = p.likedBy?.includes(user.id);
                const newLikedBy = hasLiked
                    ? p.likedBy.filter(id => id !== user.id)
                    : [...(p.likedBy || []), user.id];
                return {
                    ...p,
                    likedBy: newLikedBy,
                    likes: hasLiked ? (p.likes || 1) - 1 : (p.likes || 0) + 1
                };
            }
            return p;
        }));

        const result = await communityService.toggleLike(
            postId,
            user.id,
            user.displayName || 'Anonymous',
            user.photoURL
        );
        if (!result.success) {
            // Rollback if failed
            toast.error('Failed to update like');
            handleRefresh();
        }
    };

    const handleAddReply = async (postId: string, content: string) => {
        if (!user) return;
        if (!content.trim()) return;

        haptics.success();
        const result = await communityService.addReply(
            postId,
            user.id,
            user.displayName || 'Anonymous',
            user.photoURL,
            content
        );

        if (result.success) {
            toast.success('Reply added!');
            // Update reply count locally
            setPosts(prev => prev.map(p => {
                if (p.id === postId) {
                    return { ...p, replyCount: (p.replyCount || 0) + 1 };
                }
                return p;
            }));
            return true;
        } else {
            toast.error(result.error || 'Failed to add reply');
            return false;
        }
    };

    const getReplies = async (postId: string) => {
        return await communityService.getReplies(postId);
    };

    return {
        posts,
        loading,
        refreshing,
        loadingMore,
        hasMore,
        filter,
        setFilter: handleFilterChange,
        handleRefresh,
        handleLoadMore,
        handleCreatePost,
        handleToggleLike,
        handleAddReply,
        getReplies,
    };
};
