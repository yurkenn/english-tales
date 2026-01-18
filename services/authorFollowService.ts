import {
    getFirestore,
    collection,
    query,
    where,
    limit,
    getDocs,
    addDoc,
    writeBatch,
    serverTimestamp,
} from '@react-native-firebase/firestore';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

const COLLECTION_NAME = 'authorFollowers';

export interface AuthorFollow {
    id: string;
    authorId: string;
    followerId: string;
    createdAt: Date;
}

class AuthorFollowService {
    private db = getFirestore();

    private getCollectionRef() {
        return collection(this.db, COLLECTION_NAME);
    }

    /**
     * Check if user follows an author
     */
    async isFollowing(authorId: string, userId: string): Promise<boolean> {
        try {
            const q = query(
                this.getCollectionRef(),
                where('authorId', '==', authorId),
                where('followerId', '==', userId),
                limit(1)
            );
            const snapshot = await getDocs(q);
            return !snapshot.empty;
        } catch (error) {
            console.error('Error checking follow status:', error);
            return false;
        }
    }

    /**
     * Follow an author
     */
    async followAuthor(authorId: string, userId: string): Promise<void> {
        try {
            const exists = await this.isFollowing(authorId, userId);
            if (exists) return;

            await addDoc(this.getCollectionRef(), {
                authorId,
                followerId: userId,
                createdAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error following author:', error);
            throw error;
        }
    }

    /**
     * Unfollow an author
     */
    async unfollowAuthor(authorId: string, userId: string): Promise<void> {
        try {
            const q = query(
                this.getCollectionRef(),
                where('authorId', '==', authorId),
                where('followerId', '==', userId)
            );
            const snapshot = await getDocs(q);

            const batch = writeBatch(this.db);
            snapshot.docs.forEach((d: FirebaseFirestoreTypes.QueryDocumentSnapshot) => batch.delete(d.ref));
            await batch.commit();
        } catch (error) {
            console.error('Error unfollowing author:', error);
            throw error;
        }
    }

    /**
     * Toggle follow status
     */
    async toggleFollow(authorId: string, userId: string): Promise<boolean> {
        const isFollow = await this.isFollowing(authorId, userId);
        if (isFollow) {
            await this.unfollowAuthor(authorId, userId);
            return false;
        } else {
            await this.followAuthor(authorId, userId);
            return true;
        }
    }

    /**
     * Get follower count for an author
     */
    async getFollowerCount(authorId: string): Promise<number> {
        try {
            const q = query(
                this.getCollectionRef(),
                where('authorId', '==', authorId)
            );
            const snapshot = await getDocs(q);
            return snapshot.size;
        } catch (error) {
            console.error('Error getting follower count:', error);
            return 0;
        }
    }

    /**
     * Get list of followed author IDs for a user
     */
    async getFollowedAuthors(userId: string): Promise<string[]> {
        try {
            const q = query(
                this.getCollectionRef(),
                where('followerId', '==', userId)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map((d: FirebaseFirestoreTypes.QueryDocumentSnapshot) => d.data().authorId as string);
        } catch (error) {
            console.error('Error getting followed authors:', error);
            return [];
        }
    }
}

export const authorFollowService = new AuthorFollowService();
