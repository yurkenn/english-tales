import { useState, useEffect, useCallback } from 'react';
import { userService } from '@/services/userService';
import { socialService, FriendshipStatus } from '@/services/socialService';
import { communityService } from '@/services/communityService';
import { reviewService } from '@/services/reviewService';
import { UserProfile, CommunityPost, StoryReview, UserFavorite } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import { haptics } from '@/utils/haptics';

export type UserRelationship = 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'self';

export const useUserProfile = (profileId: string) => {
    const { user: currentUser } = useAuthStore();
    const toast = useToastStore();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [reviews, setReviews] = useState<StoryReview[]>([]);
    const [favorites, setFavorites] = useState<UserFavorite[]>([]);
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

            // 2. Fetch Relationship
            if (currentUser) {
                if (currentUser.id === profileId) {
                    setRelationship('self');
                } else {
                    const relResult = await socialService.getRelationshipStatus(currentUser.id, profileId);
                    if (relResult.success) {
                        setRelationship(relResult.data as UserRelationship);
                    }
                }
            }

            // 3. Fetch User Posts
            const postsResult = await communityService.getPostsByUser(profileId);
            if (postsResult.success) {
                setPosts(postsResult.data);
            }

            // 4. Fetch User Reviews
            const reviewsResult = await reviewService.getUserReviews(profileId);
            if (reviewsResult.success) {
                setReviews(reviewsResult.data);
            }

            // 5. Fetch User Favorites
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

    const handleAddFriend = async () => {
        if (!currentUser || !profile) return;
        setActionLoading(true);
        haptics.selection();

        const result = await socialService.sendFriendRequest(currentUser.id, profile.id);
        if (result.success) {
            toast.actions.success('Friend request sent!');
            setRelationship('pending_sent');
        } else {
            toast.actions.error(result.error || 'Failed to send request');
        }
        setActionLoading(false);
    };

    const handleAcceptRequest = async () => {
        if (!currentUser || !profile) return;
        setActionLoading(true);
        haptics.success();

        const friendshipId = [currentUser.id, profile.id].sort().join('_');
        const result = await socialService.acceptFriendRequest(friendshipId);
        if (result.success) {
            toast.actions.success('Friend request accepted!');
            setRelationship('accepted');
        } else {
            toast.actions.error('Failed to accept request');
        }
        setActionLoading(false);
    };

    const handleRemoveFriend = async () => {
        if (!currentUser || !profile) return;
        setActionLoading(true);
        haptics.light();

        const friendshipId = [currentUser.id, profile.id].sort().join('_');
        const result = await socialService.removeFriendship(friendshipId);
        if (result.success) {
            toast.actions.success('Friendship removed');
            setRelationship('none');
        } else {
            toast.actions.error('Failed to remove friendship');
        }
        setActionLoading(false);
    };

    return {
        profile,
        posts,
        reviews,
        favorites,
        relationship,
        loading,
        actionLoading,
        refresh: fetchData,
        handleAddFriend,
        handleAcceptRequest,
        handleRemoveFriend,
    };
};
