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
    getCountFromServer,
} from 'firebase/firestore';
import { Result } from '@/types/api';
import { notificationService } from './notificationService';

class AuthorService {
    private COLLECTION = 'author_follows';

    /**
     * Follow an author
     */
    async followAuthor(userId: string, userName: string, userPhoto: string | null, authorId: string, authorName: string): Promise<Result<void>> {
        try {
            const followId = `${userId}_${authorId}`;
            await setDoc(doc(db, this.COLLECTION, followId), {
                userId,
                authorId,
                authorName,
                createdAt: serverTimestamp(),
            });

            // Note: Authors are managed in Sanity, so we don't send notification to authorId 
            // unless we have a specific system for author dashboards.

            return { success: true, data: undefined };
        } catch (error) {
            console.error('Error following author:', error);
            return { success: false, error: 'Failed' };
        }
    }

    /**
     * Unfollow an author
     */
    async unfollowAuthor(userId: string, authorId: string): Promise<Result<void>> {
        try {
            const followId = `${userId}_${authorId}`;
            await deleteDoc(doc(db, this.COLLECTION, followId));
            return { success: true, data: undefined };
        } catch (error) {
            console.error('Error unfollowing author:', error);
            return { success: false, error: 'Failed' };
        }
    }

    /**
     * Check if following author
     */
    async isFollowingAuthor(userId: string, authorId: string): Promise<Result<boolean>> {
        try {
            const followId = `${userId}_author_${authorId}`;
            // Correct the followId format to be consistent or just use the userId_authorId
            const docSnap = await getDoc(doc(db, this.COLLECTION, `${userId}_${authorId}`));
            return { success: true, data: docSnap.exists() };
        } catch (error) {
            return { success: true, data: false };
        }
    }

    /**
     * Get author follower count
     */
    async getAuthorFollowerCount(authorId: string): Promise<number> {
        try {
            const q = query(
                collection(db, this.COLLECTION),
                where('authorId', '==', authorId)
            );
            const snapshot = await getCountFromServer(q);
            return snapshot.data().count;
        } catch (error) {
            console.error('Error getting author followers:', error);
            return 0;
        }
    }

    /**
     * Get list of authors followed by user
     */
    async getFollowedAuthors(userId: string): Promise<Result<string[]>> {
        try {
            const q = query(
                collection(db, this.COLLECTION),
                where('userId', '==', userId)
            );
            const snapshot = await getDocs(q);
            return { success: true, data: snapshot.docs.map(doc => doc.data().authorId) };
        } catch (error) {
            return { success: false, error: 'Failed' };
        }
    }
}

export const authorService = new AuthorService();
