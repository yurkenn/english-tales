/**
 * Social Service - Native Firebase Firestore Modular API
 */
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    deleteDoc,
    updateDoc,
    query,
    where,
    serverTimestamp,
} from '@react-native-firebase/firestore';
import { Result } from '@/types/api';
import { UserProfile } from '@/types';
import { userService } from './userService';
import { notificationService } from './notificationService';

const db = getFirestore();

export type FriendshipStatus = 'pending' | 'accepted' | 'declined';

export interface Friendship {
    id: string;
    users: [string, string];
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
            return { success: false, error: 'Failed' };
        }
    }

    async acceptFriendRequest(friendshipId: string): Promise<Result<void>> {
        try {
            await updateDoc(doc(db, this.COLLECTION, friendshipId), {
                status: 'accepted',
                updatedAt: serverTimestamp(),
            });
            return { success: true, data: undefined };
        } catch (error) {
            console.error('Error accepting friend request:', error);
            return { success: false, error: 'Failed' };
        }
    }

    async removeFriendship(friendshipId: string): Promise<Result<void>> {
        try {
            await deleteDoc(doc(db, this.COLLECTION, friendshipId));
            return { success: true, data: undefined };
        } catch (error) {
            console.error('Error removing friendship:', error);
            return { success: false, error: 'Failed' };
        }
    }

    async getRelationshipStatus(userId1: string, userId2: string): Promise<Result<FriendshipStatus | 'none' | 'pending_sent' | 'pending_received'>> {
        try {
            if (userId1 === userId2) return { success: true, data: 'none' };

            const friendshipId = this.getFriendshipId(userId1, userId2);
            const docSnap = await getDoc(doc(db, this.COLLECTION, friendshipId));

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
            const friendships = snapshot.docs.map((d: any) => d.data() as Friendship);

            const accepted: (UserProfile & { friendshipId: string })[] = [];
            const pendingIncoming: (UserProfile & { friendshipId: string })[] = [];
            const pendingOutgoing: (UserProfile & { friendshipId: string })[] = [];

            for (const f of friendships) {
                const otherUserId = f.users.find((id: string) => id !== userId)!;
                const result = await userService.getUserProfile(otherUserId);

                if (result.success) {
                    const profile = { ...result.data, friendshipId: f.id };
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

            return { success: true, data: { accepted, pendingIncoming, pendingOutgoing } };
        } catch (error) {
            console.error('Error getting friendships:', error);
            return { success: false, error: 'Failed' };
        }
    }

    async followUser(followerId: string, followerName: string, followerPhoto: string | null, targetUserId: string): Promise<Result<void>> {
        try {
            const followId = `${followerId}_${targetUserId}`;
            await setDoc(doc(db, 'follows', followId), {
                followerId,
                targetUserId,
                createdAt: serverTimestamp(),
            });

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

    async isFollowing(followerId: string, targetUserId: string): Promise<Result<boolean>> {
        try {
            const followId = `${followerId}_${targetUserId}`;
            const docSnap = await getDoc(doc(db, 'follows', followId));
            return { success: true, data: docSnap.exists() };
        } catch {
            return { success: true, data: false };
        }
    }

    async getFollowingIds(userId: string): Promise<Result<string[]>> {
        try {
            const q = query(
                collection(db, 'follows'),
                where('followerId', '==', userId)
            );
            const snapshot = await getDocs(q);
            return { success: true, data: snapshot.docs.map((d: any) => d.data().targetUserId) };
        } catch {
            return { success: false, error: 'Failed' };
        }
    }

    async getFollowingCount(userId: string): Promise<number> {
        try {
            const q = query(
                collection(db, 'follows'),
                where('followerId', '==', userId)
            );
            const snapshot = await getDocs(q);
            return snapshot.size;
        } catch (error) {
            console.error('Error getting following count:', error);
            return 0;
        }
    }

    async getFollowersCount(userId: string): Promise<number> {
        try {
            const q = query(
                collection(db, 'follows'),
                where('targetUserId', '==', userId)
            );
            const snapshot = await getDocs(q);
            return snapshot.size;
        } catch (error) {
            console.error('Error getting followers count:', error);
            return 0;
        }
    }
}

export const socialService = new SocialService();
