import {
    getFirestore,
    collection,
    query,
    where,
    limit,
    orderBy,
    getDocs,
    addDoc,
    doc,
    updateDoc,
    serverTimestamp,
} from '@react-native-firebase/firestore';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

const COLLECTION_NAME = 'userStoryProgress';

export interface UserStoryProgress {
    id: string;
    storyId: string;
    userId: string;
    currentPage: number;
    totalPages: number;
    progressPercent: number;
    lastReadAt: Date;
    isCompleted: boolean;
}

class UserStoryProgressService {
    private db = getFirestore();

    private getCollectionRef() {
        return collection(this.db, COLLECTION_NAME);
    }

    /**
     * Get progress for a specific story
     */
    async getProgress(storyId: string, userId: string): Promise<UserStoryProgress | null> {
        try {
            const q = query(
                this.getCollectionRef(),
                where('storyId', '==', storyId),
                where('userId', '==', userId),
                limit(1)
            );
            const snapshot = await getDocs(q);

            if (snapshot.empty) return null;
            return this.mapDocToProgress(snapshot.docs[0]);
        } catch (error) {
            console.error('Error getting progress:', error);
            return null;
        }
    }

    /**
     * Save or update progress
     */
    async saveProgress(
        storyId: string,
        userId: string,
        currentPage: number,
        totalPages: number
    ): Promise<void> {
        try {
            const progressPercent = Math.round((currentPage / totalPages) * 100);
            const isCompleted = currentPage >= totalPages;

            const existing = await this.getProgress(storyId, userId);

            if (existing) {
                const docRef = doc(this.db, COLLECTION_NAME, existing.id);
                await updateDoc(docRef, {
                    currentPage,
                    totalPages,
                    progressPercent,
                    isCompleted,
                    lastReadAt: serverTimestamp(),
                });
            } else {
                await addDoc(this.getCollectionRef(), {
                    storyId,
                    userId,
                    currentPage,
                    totalPages,
                    progressPercent,
                    isCompleted,
                    lastReadAt: serverTimestamp(),
                });
            }
        } catch (error) {
            console.error('Error saving progress:', error);
            throw error;
        }
    }

    /**
     * Mark story as completed
     */
    async markCompleted(storyId: string, userId: string, totalPages: number): Promise<void> {
        await this.saveProgress(storyId, userId, totalPages, totalPages);
    }

    /**
     * Get all in-progress stories for a user
     */
    async getInProgressStories(userId: string): Promise<UserStoryProgress[]> {
        try {
            const q = query(
                this.getCollectionRef(),
                where('userId', '==', userId),
                where('isCompleted', '==', false),
                orderBy('lastReadAt', 'desc'),
                limit(10)
            );
            const snapshot = await getDocs(q);

            return snapshot.docs.map((d: FirebaseFirestoreTypes.QueryDocumentSnapshot) => this.mapDocToProgress(d));
        } catch (error) {
            console.error('Error getting in-progress stories:', error);
            return [];
        }
    }

    /**
     * Get completed stories count
     */
    async getCompletedCount(userId: string): Promise<number> {
        try {
            const q = query(
                this.getCollectionRef(),
                where('userId', '==', userId),
                where('isCompleted', '==', true)
            );
            const snapshot = await getDocs(q);
            return snapshot.size;
        } catch (error) {
            console.error('Error getting completed count:', error);
            return 0;
        }
    }

    private mapDocToProgress(docSnap: FirebaseFirestoreTypes.QueryDocumentSnapshot): UserStoryProgress {
        const data = docSnap.data();
        return {
            id: docSnap.id,
            storyId: data?.storyId,
            userId: data?.userId,
            currentPage: data?.currentPage,
            totalPages: data?.totalPages,
            progressPercent: data?.progressPercent,
            lastReadAt: data?.lastReadAt?.toDate() || new Date(),
            isCompleted: data?.isCompleted || false,
        };
    }
}

export const userStoryProgressService = new UserStoryProgressService();
