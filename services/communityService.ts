import { db } from './firebase/config';
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    addDoc,
    serverTimestamp,
    doc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    getDoc,
    startAfter,
    onSnapshot,
    QuerySnapshot,
    DocumentSnapshot,
    getCountFromServer,
} from 'firebase/firestore';
import { CommunityPost, ActivityType, CommunityReply } from '@/types';
import { Result } from '@/types/api';
import { notificationService } from './notificationService';

class CommunityService {
    private COLLECTION = 'posts';
    private REPLIES_COLLECTION = 'replies';

    /**
     * Fetch posts with pagination
     */
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
            const posts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as CommunityPost));

            return {
                success: true,
                data: {
                    posts,
                    lastVisible: snapshot.docs[snapshot.docs.length - 1]
                }
            };
        } catch (error) {
            console.error('Error getting posts:', error);
            return { success: false, error: 'Failed to fetch posts' };
        }
    }

    /**
     * Create a new post
     */
    async createPost(
        userId: string,
        userName: string,
        userPhoto: string | null,
        content: string,
        type: ActivityType,
        metadata?: any
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
                likedBy: [],
                replyCount: 0,
            };

            const docRef = await addDoc(collection(db, this.COLLECTION), postData);
            return { success: true, data: docRef.id };
        } catch (error) {
            console.error('Error creating post:', error);
            return { success: false, error: 'Failed to create post' };
        }
    }

    /**
     * Toggle like on a post
     */
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

                // Send notification to post owner
                if (data.userId !== userId) {
                    await notificationService.createSocialNotification(data.userId, {
                        type: 'like',
                        senderId: userId,
                        senderName: userName,
                        senderPhoto: userPhoto,
                        postId: postId,
                        content: data.content.substring(0, 50),
                    });
                }

                return { success: true, data: true };
            }
        } catch (error) {
            console.error('Error toggling like:', error);
            return { success: false, error: 'Failed to update like' };
        }
    }

    /**
     * Add a reply to a post
     */
    async addReply(
        postId: string,
        userId: string,
        userName: string,
        userPhoto: string | null,
        content: string
    ): Promise<Result<string>> {
        try {
            const replyData = {
                postId,
                userId,
                userName,
                userPhoto,
                content,
                timestamp: serverTimestamp(),
                likes: 0,
                likedBy: [],
            };

            const docRef = await addDoc(collection(db, this.REPLIES_COLLECTION), replyData);

            // Increment reply count on post
            const postRef = doc(db, this.COLLECTION, postId);
            const postSnap = await getDoc(postRef);
            if (postSnap.exists()) {
                const data = postSnap.data() as CommunityPost;
                await updateDoc(postRef, {
                    replyCount: (data.replyCount || 0) + 1
                });

                // Send notification to post owner
                if (data.userId !== userId) {
                    await notificationService.createSocialNotification(data.userId, {
                        type: 'reply',
                        senderId: userId,
                        senderName: userName,
                        senderPhoto: userPhoto,
                        postId: postId,
                        content: content.substring(0, 50),
                    });
                }
            }

            return { success: true, data: docRef.id };
        } catch (error) {
            console.error('Error adding reply:', error);
            return { success: false, error: 'Failed to add reply' };
        }
    }

    /**
     * Get replies for a post
     */
    async getReplies(postId: string): Promise<Result<CommunityReply[]>> {
        try {
            const q = query(
                collection(db, this.REPLIES_COLLECTION),
                where('postId', '==', postId),
                orderBy('timestamp', 'asc')
            );

            const snapshot = await getDocs(q);
            const replies = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as CommunityReply));

            return { success: true, data: replies };
        } catch (error) {
            console.error('Error getting replies:', error);
            return { success: false, error: 'Failed to fetch replies' };
        }
    }

    /**
     * Get posts for a specific user
     */
    async getPostsByUser(userId: string, postsLimit: number = 20): Promise<Result<CommunityPost[]>> {
        try {
            const q = query(
                collection(db, this.COLLECTION),
                where('userId', '==', userId),
                orderBy('timestamp', 'desc'),
                limit(postsLimit)
            );

            const snapshot = await getDocs(q);
            const posts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as CommunityPost));

            return { success: true, data: posts };
        } catch (error) {
            console.error('Error getting user posts:', error);
            return { success: false, error: 'Failed to fetch user posts' };
        }
    }

    /**
     * Get review count for a user
     */
    async getUserReviewCount(userId: string): Promise<number> {
        try {
            const q = query(
                collection(db, this.COLLECTION),
                where('userId', '==', userId),
                where('type', '==', 'review')
            );
            const snapshot = await getCountFromServer(q);
            return snapshot.data().count;
        } catch (error) {
            console.error('Error getting review count:', error);
            return 0;
        }
    }

    /**
     * Get posts from a list of users (Following feed)
     */
    async getFollowingPosts(userIds: string[], postsLimit: number = 20, lastDoc?: any): Promise<Result<{ posts: CommunityPost[], lastVisible: any }>> {
        try {
            if (userIds.length === 0) {
                return { success: true, data: { posts: [], lastVisible: null } };
            }

            // Firestore 'in' query limit is 30 in modern versions (previously 10)
            // If more than 30, we'd need to chunk. Let's assume < 30 for now or chunk if needed.
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
            const posts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as CommunityPost));

            return {
                success: true,
                data: {
                    posts,
                    lastVisible: snapshot.docs[snapshot.docs.length - 1]
                }
            };
        } catch (error) {
            console.error('Error getting following posts:', error);
            return { success: false, error: 'Failed to fetch following feed' };
        }
    }

    /**
     * Subscribe to real-time updates for the feed (initial load)
     */
    subscribeToFeed(callback: (posts: CommunityPost[]) => void) {
        const q = query(
            collection(db, this.COLLECTION),
            orderBy('timestamp', 'desc'),
            limit(50)
        );

        return onSnapshot(q, (snapshot: QuerySnapshot) => {
            const posts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as CommunityPost));
            callback(posts);
        });
    }
}

export const communityService = new CommunityService();
