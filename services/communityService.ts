/**
 * Community Service - Native Firebase Firestore Modular API
 */
import {
    getFirestore,
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    onSnapshot,
    serverTimestamp,
    arrayUnion,
    arrayRemove,
} from '@react-native-firebase/firestore';
import { CommunityPost, ActivityType, CommunityReply } from '@/types';
import { Result } from '@/types/api';
import { notificationService } from './notificationService';

const db = getFirestore();

// Admin user IDs - can delete any post
// Add more user IDs to give admin access
export const ADMIN_USER_IDS = [
    '2ZEBSYikdNhspWWGPcEkAgM52pE2', // Oğuz Yürken
    // Add more admin IDs here:
    // 'USER_ID_HERE',
];

class CommunityService {
    private COLLECTION = 'posts';
    private REPLIES_COLLECTION = 'replies';
    private REPORTS_COLLECTION = 'reports';

    async getPostById(postId: string): Promise<Result<CommunityPost>> {
        try {
            const postSnap = await getDoc(doc(db, this.COLLECTION, postId));

            if (!postSnap.exists()) {
                return { success: false, error: 'Post not found' };
            }

            return {
                success: true,
                data: { id: postSnap.id, ...postSnap.data() } as CommunityPost
            };
        } catch (error) {
            console.error('Error getting post:', error);
            return { success: false, error: 'Failed to fetch post' };
        }
    }

    async getPosts(postsLimit: number = 20, lastDoc?: any): Promise<Result<{ posts: CommunityPost[], lastVisible: any }>> {
        try {
            let q = query(
                collection(db, this.COLLECTION),
                orderBy('timestamp', 'desc'),
                limit(postsLimit)
            );

            if (lastDoc) {
                q = query(q, startAfter(lastDoc));
            }

            const snapshot = await getDocs(q);
            const posts = snapshot.docs.map((d: any) => ({
                id: d.id,
                ...d.data()
            } as CommunityPost));

            return {
                success: true,
                data: {
                    posts,
                    lastVisible: snapshot.docs[snapshot.docs.length - 1] || null
                }
            };
        } catch (error) {
            console.error('Error getting posts:', error);
            return { success: false, error: 'Failed to fetch posts' };
        }
    }

    async createPost(
        userId: string,
        userName: string,
        userPhoto: string | null,
        content: string,
        type: ActivityType,
        metadata?: Record<string, any>
    ): Promise<Result<string>> {
        try {
            const postData = {
                userId,
                userName,
                userPhoto,
                content,
                type,
                metadata: metadata || {},
                timestamp: serverTimestamp(),
                likes: 0,
                likedBy: [] as string[],
                replyCount: 0,
            };

            const docRef = await addDoc(collection(db, this.COLLECTION), postData);
            return { success: true, data: docRef.id };
        } catch (error) {
            console.error('Error creating post:', error);
            return { success: false, error: 'Failed to create post' };
        }
    }

    async toggleLike(postId: string, userId: string, userName: string, userPhoto: string | null): Promise<Result<boolean>> {
        try {
            const postRef = doc(db, this.COLLECTION, postId);
            const postSnap = await getDoc(postRef);

            if (!postSnap.exists()) {
                return { success: false, error: 'Post not found' };
            }

            const data = postSnap.data() as CommunityPost;
            const hasLiked = data.likedBy?.includes(userId);

            if (hasLiked) {
                await updateDoc(postRef, {
                    likedBy: arrayRemove(userId),
                    likes: (data.likes || 1) - 1
                });
                return { success: true, data: false };
            } else {
                await updateDoc(postRef, {
                    likedBy: arrayUnion(userId),
                    likes: (data.likes || 0) + 1
                });

                if (data.userId !== userId) {
                    // Note: Social notifications require Cloud Functions to work properly
                    // because security rules prevent writing to other users' subcollections
                    // Silently skip notification creation for now
                    // TODO: Implement via Cloud Functions for production
                    try {
                        await notificationService.createSocialNotification(data.userId, {
                            type: 'like',
                            senderId: userId,
                            senderName: userName,
                            senderPhoto: userPhoto,
                            postId: postId,
                            content: data.content.substring(0, 50),
                        });
                    } catch {
                        // Silently ignore - notification requires Cloud Functions
                    }
                }

                return { success: true, data: true };
            }
        } catch (error) {
            console.error('Error toggling like:', error);
            return { success: false, error: 'Failed to update like' };
        }
    }

    async addReply(
        postId: string,
        userId: string,
        userName: string,
        userPhoto: string | null,
        content: string,
        parentId: string | null = null,
        depth: number = 0
    ): Promise<Result<string>> {
        try {
            const replyData = {
                postId,
                parentId,
                depth,
                userId,
                userName,
                userPhoto,
                content,
                timestamp: serverTimestamp(),
                likes: 0,
                likedBy: [] as string[],
            };

            const docRef = await addDoc(collection(db, this.REPLIES_COLLECTION), replyData);

            const postRef = doc(db, this.COLLECTION, postId);
            const postSnap = await getDoc(postRef);
            if (postSnap.exists()) {
                const data = postSnap.data() as CommunityPost;
                await updateDoc(postRef, {
                    replyCount: (data.replyCount || 0) + 1
                });

                if (data.userId !== userId) {
                    try {
                        await notificationService.createSocialNotification(data.userId, {
                            type: 'reply',
                            senderId: userId,
                            senderName: userName,
                            senderPhoto: userPhoto,
                            postId: postId,
                            content: content.substring(0, 50),
                        });
                    } catch {
                        // Silently ignore - notification requires Cloud Functions
                    }
                }
            }

            return { success: true, data: docRef.id };
        } catch (error) {
            console.error('Error adding reply:', error);
            return { success: false, error: 'Failed to add reply' };
        }
    }

    async getReplies(postId: string): Promise<Result<CommunityReply[]>> {
        try {
            const q = query(
                collection(db, this.REPLIES_COLLECTION),
                where('postId', '==', postId),
                orderBy('timestamp', 'asc')
            );

            const snapshot = await getDocs(q);
            const replies = snapshot.docs.map((d: any) => ({
                id: d.id,
                ...d.data()
            } as CommunityReply));

            return { success: true, data: replies };
        } catch (error) {
            console.error('Error getting replies:', error);
            return { success: false, error: 'Failed to fetch replies' };
        }
    }

    async getPostsByUser(userId: string, postsLimit: number = 20): Promise<Result<CommunityPost[]>> {
        try {
            const q = query(
                collection(db, this.COLLECTION),
                where('userId', '==', userId),
                orderBy('timestamp', 'desc'),
                limit(postsLimit)
            );

            const snapshot = await getDocs(q);
            const posts = snapshot.docs.map((d: any) => ({
                id: d.id,
                ...d.data()
            } as CommunityPost));

            return { success: true, data: posts };
        } catch (error) {
            console.error('Error getting user posts:', error);
            return { success: false, error: 'Failed to fetch user posts' };
        }
    }

    async getUserReviewCount(userId: string): Promise<number> {
        try {
            const q = query(
                collection(db, this.COLLECTION),
                where('userId', '==', userId),
                where('type', '==', 'review')
            );
            const snapshot = await getDocs(q);
            return snapshot.size;
        } catch (error) {
            console.error('Error getting review count:', error);
            return 0;
        }
    }

    async getFollowingPosts(userIds: string[], postsLimit: number = 20, lastDoc?: any): Promise<Result<{ posts: CommunityPost[], lastVisible: any }>> {
        try {
            if (userIds.length === 0) {
                return { success: true, data: { posts: [], lastVisible: null } };
            }

            const userIdsChunk = userIds.slice(0, 30);

            let q = query(
                collection(db, this.COLLECTION),
                where('userId', 'in', userIdsChunk),
                orderBy('timestamp', 'desc'),
                limit(postsLimit)
            );

            if (lastDoc) {
                q = query(q, startAfter(lastDoc));
            }

            const snapshot = await getDocs(q);
            const posts = snapshot.docs.map((d: any) => ({
                id: d.id,
                ...d.data()
            } as CommunityPost));

            return {
                success: true,
                data: {
                    posts,
                    lastVisible: snapshot.docs[snapshot.docs.length - 1] || null
                }
            };
        } catch (error) {
            console.error('Error getting following posts:', error);
            return { success: false, error: 'Failed to fetch following feed' };
        }
    }

    subscribeToFeed(callback: (posts: CommunityPost[]) => void) {
        const q = query(
            collection(db, this.COLLECTION),
            orderBy('timestamp', 'desc'),
            limit(50)
        );

        return onSnapshot(q, snapshot => {
            const posts = snapshot.docs.map((d: any) => ({
                id: d.id,
                ...d.data()
            } as CommunityPost));
            callback(posts);
        });
    }

    async getBuzzActivities(limitCount: number = 10): Promise<Result<CommunityPost[]>> {
        try {
            const q = query(
                collection(db, this.COLLECTION),
                where('type', 'in', ['story_completed', 'achievement', 'started_reading', 'story_review']),
                orderBy('timestamp', 'desc'),
                limit(limitCount)
            );

            const snapshot = await getDocs(q);
            const activities = snapshot.docs.map((d: any) => ({
                id: d.id,
                ...d.data()
            } as CommunityPost));

            return { success: true, data: activities };
        } catch (error) {
            console.error('Error getting buzz activities:', error);
            return { success: false, error: 'Failed to fetch buzz' };
        }
    }

    async seedCommunityActivities(): Promise<Result<void>> {
        try {
            const q = query(collection(db, this.COLLECTION), limit(6));
            const snapshot = await getDocs(q);
            if (snapshot.size > 5) return { success: true, data: undefined };

            const seeds: any[] = [
                {
                    userId: 'seed_1',
                    userName: 'Sophie',
                    userPhoto: 'https://i.pravatar.cc/150?u=seed_1',
                    content: 'Just finished reading a beautiful story!',
                    type: 'story_completed',
                    metadata: { storyTitle: 'The Ugly Duckling', storyId: 's1' },
                    timestamp: serverTimestamp(),
                    likes: 12,
                    likedBy: [],
                    replyCount: 0,
                },
                {
                    userId: 'seed_2',
                    userName: 'Mert',
                    userPhoto: 'https://i.pravatar.cc/150?u=seed_2',
                    content: "Can't believe I maintained this streak for 7 days!",
                    type: 'achievement',
                    metadata: { achievementTitle: '7 Day Streak', achievementId: 'a1' },
                    timestamp: serverTimestamp(),
                    likes: 8,
                    likedBy: [],
                    replyCount: 0,
                },
            ];

            for (const seed of seeds) {
                await addDoc(collection(db, this.COLLECTION), seed);
            }

            return { success: true, data: undefined };
        } catch (error) {
            console.error('Error seeding community:', error);
            return { success: false, error: 'Failed to seed' };
        }
    }

    // ========== MODERATION ==========

    async reportPost(postId: string, reporterId: string, reason: string): Promise<Result<void>> {
        try {
            await addDoc(collection(db, this.REPORTS_COLLECTION), {
                postId,
                reporterId,
                reason,
                timestamp: serverTimestamp(),
                status: 'pending',
            });
            return { success: true, data: undefined };
        } catch (error) {
            console.error('Error reporting post:', error);
            return { success: false, error: 'Failed to report post' };
        }
    }

    async deletePost(postId: string, deletedBy: string): Promise<Result<void>> {
        try {
            // Delete the post
            await deleteDoc(doc(db, this.COLLECTION, postId));

            // Delete all replies for this post
            const repliesQuery = query(
                collection(db, this.REPLIES_COLLECTION),
                where('postId', '==', postId)
            );
            const repliesSnap = await getDocs(repliesQuery);
            for (const replyDoc of repliesSnap.docs) {
                await deleteDoc(replyDoc.ref);
            }

            console.log(`Post ${postId} deleted by ${deletedBy}`);
            return { success: true, data: undefined };
        } catch (error) {
            console.error('Error deleting post:', error);
            return { success: false, error: 'Failed to delete post' };
        }
    }

    isAdmin(userId: string): boolean {
        return ADMIN_USER_IDS.includes(userId);
    }
}

export const communityService = new CommunityService();
