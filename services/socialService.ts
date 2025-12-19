import { db } from './firebase/config';
import {
    doc,
    setDoc,
    getDoc,
    deleteDoc,
    serverTimestamp,
    collection,
    query,
    where,
    getDocs,
    updateDoc,
    orderBy,
} from 'firebase/firestore';
import { Result } from '@/types/api';
import { UserProfile } from '@/types';
import { userService } from './userService';
import { notificationService } from './notificationService';

export type FriendshipStatus = 'pending' | 'accepted' | 'declined';

export interface Friendship {
    id: string; // senderId_receiverId
    users: [string, string]; // [userA, userB]
    senderId: string;
    receiverId: string;
    status: FriendshipStatus;
    createdAt: any;
    updatedAt: any;
}

class SocialService {
    private COLLECTION = 'friendships';

    private getFriendshipId(userId1: string, userId2: string) {
        return [userId1, userId2].sort().join('_');
    }

    /**
     * Send a friend request
     */
    async sendFriendRequest(senderId: string, receiverId: string): Promise<Result<void>> {
        try {
            if (senderId === receiverId) return { success: false, error: 'Cannot add yourself' };

            const friendshipId = this.getFriendshipId(senderId, receiverId);
            const docRef = doc(db, this.COLLECTION, friendshipId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data() as Friendship;
                if (data.status === 'accepted') return { success: false, error: 'Already friends' };
                if (data.status === 'pending') return { success: false, error: 'Request already pending' };
            }

            const friendship: Friendship = {
                id: friendshipId,
                users: [senderId, receiverId].sort() as [string, string],
                senderId,
                receiverId,
                status: 'pending',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            await setDoc(docRef, friendship);
            return { success: true, data: undefined };
        } catch (error) {
            console.error('Error sending friend request:', error);
            return { success: false, error: 'Failed to send friend request' };
        }
    }

    /**
     * Accept a friend request
     */
    async acceptFriendRequest(friendshipId: string): Promise<Result<void>> {
        try {
            const docRef = doc(db, this.COLLECTION, friendshipId);
            await updateDoc(docRef, {
                status: 'accepted',
                updatedAt: serverTimestamp(),
            });
            return { success: true, data: undefined };
        } catch (error) {
            console.error('Error accepting friend request:', error);
            return { success: false, error: 'Failed to accept friend request' };
        }
    }

    /**
     * Decline or remove a friend
     */
    async removeFriendship(friendshipId: string): Promise<Result<void>> {
        try {
            const docRef = doc(db, this.COLLECTION, friendshipId);
            await deleteDoc(docRef);
            return { success: true, data: undefined };
        } catch (error) {
            console.error('Error removing friendship:', error);
            return { success: false, error: 'Failed' };
        }
    }

    /**
     * Get the friendship status between two users
     */
    async getRelationshipStatus(userId1: string, userId2: string): Promise<Result<FriendshipStatus | 'none' | 'pending_sent' | 'pending_received'>> {
        try {
            if (userId1 === userId2) return { success: true, data: 'none' };

            const friendshipId = this.getFriendshipId(userId1, userId2);
            const docRef = doc(db, this.COLLECTION, friendshipId);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                return { success: true, data: 'none' };
            }

            const data = docSnap.data() as Friendship;

            if (data.status === 'accepted') return { success: true, data: 'accepted' };

            if (data.status === 'pending') {
                return {
                    success: true,
                    data: data.senderId === userId1 ? 'pending_sent' : 'pending_received'
                };
            }

            return { success: true, data: 'none' };
        } catch (error) {
            console.error('Error getting relationship status:', error);
            return { success: false, error: 'Failed' };
        }
    }

    /**
     * Get all friendships for a user
     */
    async getFriendships(userId: string): Promise<Result<{
        accepted: (UserProfile & { friendshipId: string })[],
        pendingIncoming: (UserProfile & { friendshipId: string })[],
        pendingOutgoing: (UserProfile & { friendshipId: string })[]
    }>> {
        try {
            const q = query(
                collection(db, this.COLLECTION),
                where('users', 'array-contains', userId)
            );

            const snapshot = await getDocs(q);
            const friendships = snapshot.docs.map(doc => doc.data() as Friendship);

            const accepted: (UserProfile & { friendshipId: string })[] = [];
            const pendingIncoming: (UserProfile & { friendshipId: string })[] = [];
            const pendingOutgoing: (UserProfile & { friendshipId: string })[] = [];

            for (const f of friendships) {
                const otherUserId = f.users.find(id => id !== userId)!;
                const userProfileResult = await userService.getUserProfile(otherUserId);

                if (userProfileResult.success) {
                    const profile = { ...userProfileResult.data, friendshipId: f.id };
                    if (f.status === 'accepted') {
                        accepted.push(profile);
                    } else if (f.status === 'pending') {
                        if (f.receiverId === userId) {
                            pendingIncoming.push(profile);
                        } else {
                            pendingOutgoing.push(profile);
                        }
                    }
                }
            }

            return {
                success: true,
                data: { accepted, pendingIncoming, pendingOutgoing }
            };
        } catch (error) {
            console.error('Error getting friendships:', error);
            return { success: false, error: 'Failed to get friends' };
        }
    }

    /**
     * Follow a user
     */
    async followUser(followerId: string, followerName: string, followerPhoto: string | null, targetUserId: string): Promise<Result<void>> {
        try {
            const followId = `${followerId}_${targetUserId}`;
            await setDoc(doc(db, 'follows', followId), {
                followerId,
                targetUserId,
                createdAt: serverTimestamp(),
            });

            // Send notification
            await notificationService.createSocialNotification(targetUserId, {
                type: 'follow',
                senderId: followerId,
                senderName: followerName,
                senderPhoto: followerPhoto,
            });

            return { success: true, data: undefined };
        } catch (error) {
            console.error('Error following user:', error);
            return { success: false, error: 'Failed' };
        }
    }

    /**
     * Unfollow a user
     */
    async unfollowUser(followerId: string, targetUserId: string): Promise<Result<void>> {
        try {
            const followId = `${followerId}_${targetUserId}`;
            await deleteDoc(doc(db, 'follows', followId));
            return { success: true, data: undefined };
        } catch (error) {
            console.error('Error unfollowing user:', error);
            return { success: false, error: 'Failed' };
        }
    }

    /**
     * Check if following
     */
    async isFollowing(followerId: string, targetUserId: string): Promise<Result<boolean>> {
        try {
            const followId = `${followerId}_${targetUserId}`;
            const docSnap = await getDoc(doc(db, 'follows', followId));
            return { success: true, data: docSnap.exists() };
        } catch (error) {
            return { success: true, data: false };
        }
    }

    /**
     * Get following IDs
     */
    async getFollowingIds(userId: string): Promise<Result<string[]>> {
        try {
            const q = query(
                collection(db, 'follows'),
                where('followerId', '==', userId)
            );
            const snapshot = await getDocs(q);
            return { success: true, data: snapshot.docs.map(doc => doc.data().targetUserId) };
        } catch (error) {
            return { success: false, error: 'Failed' };
        }
    }
}

export const socialService = new SocialService();
