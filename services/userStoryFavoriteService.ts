import {
    getFirestore,
    collection,
    query,
    where,
    limit,
    orderBy,
    getDocs,
    addDoc,
    writeBatch,
    serverTimestamp,
} from '@react-native-firebase/firestore';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

const COLLECTION_NAME = 'userStoryFavorites';

export interface UserStoryFavorite {
    id: string;
    storyId: string;
    userId: string;
    createdAt: Date;
}

class UserStoryFavoriteService {
    private db = getFirestore();

    private getCollectionRef() {
        return collection(this.db, COLLECTION_NAME);
    }

    /**
     * Check if a story is favorited by user
     */
    async isFavorited(storyId: string, userId: string): Promise<boolean> {
        try {
            const q = query(
                this.getCollectionRef(),
                where('storyId', '==', storyId),
                where('userId', '==', userId),
                limit(1)
            );
            const snapshot = await getDocs(q);

            return !snapshot.empty;
        } catch (error) {
            console.error('Error checking favorite:', error);
            return false;
        }
    }

    /**
     * Add story to favorites
     */
    async addFavorite(storyId: string, userId: string): Promise<void> {
        try {
            const exists = await this.isFavorited(storyId, userId);
            if (exists) return;

            await addDoc(this.getCollectionRef(), {
                storyId,
                userId,
                createdAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error adding favorite:', error);
            throw error;
        }
    }

    /**
     * Remove story from favorites
     */
    async removeFavorite(storyId: string, userId: string): Promise<void> {
        try {
            const q = query(
                this.getCollectionRef(),
                where('storyId', '==', storyId),
                where('userId', '==', userId)
            );
            const snapshot = await getDocs(q);

            const batch = writeBatch(this.db);
            snapshot.docs.forEach((d: FirebaseFirestoreTypes.QueryDocumentSnapshot) => batch.delete(d.ref));
            await batch.commit();
        } catch (error) {
            console.error('Error removing favorite:', error);
            throw error;
        }
    }

    /**
     * Toggle favorite status
     */
    async toggleFavorite(storyId: string, userId: string): Promise<boolean> {
        const isFav = await this.isFavorited(storyId, userId);
        if (isFav) {
            await this.removeFavorite(storyId, userId);
            return false;
        } else {
            await this.addFavorite(storyId, userId);
            return true;
        }
    }

    /**
     * Get all favorites for a user
     */
    async getUserFavorites(userId: string): Promise<string[]> {
        try {
            const q = query(
                this.getCollectionRef(),
                where('userId', '==', userId),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);

            return snapshot.docs.map((d: FirebaseFirestoreTypes.QueryDocumentSnapshot) => d.data().storyId as string);
        } catch (error) {
            console.error('Error getting favorites:', error);
            return [];
        }
    }

    /**
     * Get favorite count for a story
     */
    async getFavoriteCount(storyId: string): Promise<number> {
        try {
            const q = query(
                this.getCollectionRef(),
                where('storyId', '==', storyId)
            );
            const snapshot = await getDocs(q);

            return snapshot.size;
        } catch (error) {
            console.error('Error getting favorite count:', error);
            return 0;
        }
    }
}

export const userStoryFavoriteService = new UserStoryFavoriteService();
