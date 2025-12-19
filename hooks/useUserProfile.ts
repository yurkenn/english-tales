import { useState, useEffect, useCallback } from 'react';
import { userService } from '@/services/userService';
import { socialService, FriendshipStatus } from '@/services/socialService';
import { communityService } from '@/services/communityService';
import { reviewService } from '@/services/reviewService';
import { UserProfile, CommunityPost, StoryReview, UserFavorite, LibraryItem } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import { haptics } from '@/utils/haptics';

export type UserRelationship = 'none' | 'following' | 'self';

export const useUserProfile = (profileId: string) => {
    const { user: currentUser } = useAuthStore();
    const toast = useToastStore();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [reviews, setReviews] = useState<StoryReview[]>([]);
    const [favorites, setFavorites] = useState<UserFavorite[]>([]);
    const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
    const [stats, setStats] = useState({ followers: 0, following: 0, streak: 0 });
    const [relationship, setRelationship] = useState<UserRelationship>('none');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchData = useCallback(async () => {
        if (!profileId) return;
        setLoading(true);

        try {
            // 1. Fetch Profile
            const profileResult = await userService.getUserProfile(profileId);
            if (profileResult.success) {
                setProfile(profileResult.data);
            }

            // 2. Fetch Stats (Followers, Following, Streak)
            const [followersCount, followingCount, libRes] = await Promise.all([
                socialService.getFollowersCount(profileId),
                socialService.getFollowingCount(profileId),
                userService.getUserLibrary(profileId)
            ]);

            // Calculate streak from library items if available
            // Note: Since we don't have a direct streak field in profile yet, 
            // we'll use a mocked value or calculate from recent activity if possible.
            // For now, let's use the follower/following counts.
            setStats({
                followers: followersCount,
                following: followingCount,
                streak: (profileResult.success ? profileResult.data?.streak : 0) || 0
            });

            if (libRes.success) {
                setLibraryItems(libRes.data);
            }

            // 3. Fetch Relationship (Following Status)
            if (currentUser) {
                if (currentUser.id === profileId) {
                    setRelationship('self');
                } else {
                    const relResult = await socialService.isFollowing(currentUser.id, profileId);
                    if (relResult.success) {
                        setRelationship(relResult.data ? 'following' : 'none');
                    }
                }
            }

            // 4. Fetch User Posts
            const postsResult = await communityService.getPostsByUser(profileId);
            if (postsResult.success) {
                setPosts(postsResult.data);
            }

            // 5. Fetch User Reviews
            const reviewsResult = await reviewService.getUserReviews(profileId);
            if (reviewsResult.success) {
                setReviews(reviewsResult.data);
            }

            // 6. Fetch User Favorites
            const favoritesResult = await reviewService.getUserFavorites(profileId);
            if (favoritesResult.success) {
                setFavorites(favoritesResult.data);
            }

        } catch (error) {
            console.error('Error fetching user profile data:', error);
            toast.actions.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    }, [profileId, currentUser, toast.actions]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFollow = async () => {
        if (!currentUser || !profile) return;
        setActionLoading(true);
        haptics.selection();

        const result = await socialService.followUser(
            currentUser.id,
            currentUser.displayName || 'Anonymous',
            currentUser.photoURL,
            profile.id
        );

        if (result.success) {
            toast.actions.success(`Following ${profile.displayName}`);
            setRelationship('following');
            setStats(prev => ({ ...prev, followers: prev.followers + 1 }));
        } else {
            toast.actions.error('Failed to follow user');
        }
        setActionLoading(false);
    };

    const handleUnfollow = async () => {
        if (!currentUser || !profile) return;
        setActionLoading(true);
        haptics.light();

        const result = await socialService.unfollowUser(currentUser.id, profile.id);
        if (result.success) {
            toast.actions.success('Unfollowed');
            setRelationship('none');
            setStats(prev => ({ ...prev, followers: Math.max(0, prev.followers - 1) }));
        } else {
            toast.actions.error('Failed to unfollow');
        }
        setActionLoading(false);
    };

    return {
        profile,
        posts,
        reviews,
        favorites,
        libraryItems,
        stats,
        relationship,
        loading,
        actionLoading,
        refresh: fetchData,
        handleFollow,
        handleUnfollow,
        recentlyReadStory: libraryItems.length > 0 ? libraryItems[0].story : null,
    };
};
