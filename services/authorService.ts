/**
 * Author Service - Native Firebase Firestore Modular API
 */
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    deleteDoc,
    query,
    where,
    serverTimestamp,
} from '@react-native-firebase/firestore';
import { Result } from '@/types/api';

const db = getFirestore();

class AuthorService {
    private COLLECTION = 'author_follows';

    async followAuthor(userId: string, _userName: string, _userPhoto: string | null, authorId: string, authorName: string): Promise<Result<void>> {
        try {
            const followId = `${userId}_${authorId}`;
            await setDoc(doc(db, this.COLLECTION, followId), {
                userId,
                authorId,
                authorName,
                createdAt: serverTimestamp(),
            });
            return { success: true, data: undefined };
        } catch (error) {
            console.error('Error following author:', error);
            return { success: false, error: 'Failed' };
        }
    }

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

    async isFollowingAuthor(userId: string, authorId: string): Promise<Result<boolean>> {
        try {
            const docSnap = await getDoc(doc(db, this.COLLECTION, `${userId}_${authorId}`));
            return { success: true, data: docSnap.exists() };
        } catch {
            return { success: true, data: false };
        }
    }

    async getAuthorFollowerCount(authorId: string): Promise<number> {
        try {
            const q = query(
                collection(db, this.COLLECTION),
                where('authorId', '==', authorId)
            );
            const snapshot = await getDocs(q);
            return snapshot.size;
        } catch (error) {
            console.error('Error getting author followers:', error);
            return 0;
        }
    }

    async getFollowedAuthors(userId: string): Promise<Result<string[]>> {
        try {
            const q = query(
                collection(db, this.COLLECTION),
                where('userId', '==', userId)
            );
            const snapshot = await getDocs(q);
            return { success: true, data: snapshot.docs.map((d: any) => d.data().authorId) };
        } catch {
            return { success: false, error: 'Failed' };
        }
    }
}

export const authorService = new AuthorService();
