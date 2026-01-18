import {
    getFirestore,
    collection,
    query,
    where,
    limit,
    orderBy,
    getDocs,
    getDoc,
    addDoc,
    doc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
} from '@react-native-firebase/firestore';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export interface UserStoryReview {
    id: string;
    storyId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    rating: number; // 1-5
    content: string;
    createdAt: Date;
    updatedAt: Date;
    helpful: number;
}

interface CreateReviewData {
    storyId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    rating: number;
    content: string;
}

const COLLECTION_NAME = 'userStoryReviews';

class UserStoryReviewService {
    private db = getFirestore();

    private getCollectionRef() {
        return collection(this.db, COLLECTION_NAME);
    }

    /**
     * Get all reviews for a specific user story
     */
    async getReviewsForStory(storyId: string, maxResults = 20): Promise<UserStoryReview[]> {
        try {
            const q = query(
                this.getCollectionRef(),
                where('storyId', '==', storyId),
                orderBy('createdAt', 'desc'),
                limit(maxResults)
            );
            const snapshot = await getDocs(q);

            return snapshot.docs.map((d: FirebaseFirestoreTypes.QueryDocumentSnapshot) => this.mapDocToReview(d));
        } catch (error) {
            console.error('Error fetching reviews:', error);
            return [];
        }
    }

    /**
     * Get review by user for a specific story (to check if already reviewed)
     */
    async getUserReviewForStory(storyId: string, userId: string): Promise<UserStoryReview | null> {
        try {
            const q = query(
                this.getCollectionRef(),
                where('storyId', '==', storyId),
                where('userId', '==', userId),
                limit(1)
            );
            const snapshot = await getDocs(q);

            if (snapshot.empty) return null;
            return this.mapDocToReview(snapshot.docs[0]);
        } catch (error) {
            console.error('Error fetching user review:', error);
            return null;
        }
    }

    /**
     * Create a new review
     */
    async createReview(data: CreateReviewData): Promise<UserStoryReview | null> {
        try {
            // Check if user already reviewed this story
            const existingReview = await this.getUserReviewForStory(data.storyId, data.userId);
            if (existingReview) {
                throw new Error('You have already reviewed this story');
            }

            const docRef = await addDoc(this.getCollectionRef(), {
                ...data,
                helpful: 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            // Fetch the created document
            const newDoc = await getDoc(docRef);
            if (!newDoc.exists) {
                throw new Error('Failed to create review');
            }
            return this.mapDocToReview(newDoc as FirebaseFirestoreTypes.QueryDocumentSnapshot);
        } catch (error) {
            console.error('Error creating review:', error);
            throw error;
        }
    }

    /**
     * Update an existing review
     */
    async updateReview(reviewId: string, userId: string, data: { rating?: number; content?: string }): Promise<void> {
        try {
            const docRef = doc(this.db, COLLECTION_NAME, reviewId);
            const reviewDoc = await getDoc(docRef);

            if (!reviewDoc.exists) {
                throw new Error('Review not found');
            }

            if (reviewDoc.data()?.userId !== userId) {
                throw new Error('You can only edit your own reviews');
            }

            await updateDoc(docRef, {
                ...data,
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error updating review:', error);
            throw error;
        }
    }

    /**
     * Delete a review
     */
    async deleteReview(reviewId: string, userId: string): Promise<void> {
        try {
            const docRef = doc(this.db, COLLECTION_NAME, reviewId);
            const reviewDoc = await getDoc(docRef);

            if (!reviewDoc.exists) {
                throw new Error('Review not found');
            }

            if (reviewDoc.data()?.userId !== userId) {
                throw new Error('You can only delete your own reviews');
            }

            await deleteDoc(docRef);
        } catch (error) {
            console.error('Error deleting review:', error);
            throw error;
        }
    }

    /**
     * Mark a review as helpful
     */
    async markHelpful(reviewId: string): Promise<void> {
        try {
            const docRef = doc(this.db, COLLECTION_NAME, reviewId);
            const reviewDoc = await getDoc(docRef);

            if (!reviewDoc.exists) {
                throw new Error('Review not found');
            }

            const currentHelpful = reviewDoc.data()?.helpful || 0;
            await updateDoc(docRef, {
                helpful: currentHelpful + 1,
            });
        } catch (error) {
            console.error('Error marking helpful:', error);
            throw error;
        }
    }

    /**
     * Get average rating for a story
     */
    async getAverageRating(storyId: string): Promise<{ average: number; count: number }> {
        try {
            const q = query(
                this.getCollectionRef(),
                where('storyId', '==', storyId)
            );
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                return { average: 0, count: 0 };
            }

            const ratings: number[] = snapshot.docs.map((d: FirebaseFirestoreTypes.QueryDocumentSnapshot) => d.data().rating as number);
            const sum = ratings.reduce((acc: number, rating: number) => acc + rating, 0);
            const average = sum / ratings.length;

            return { average: Math.round(average * 10) / 10, count: ratings.length };
        } catch (error) {
            console.error('Error calculating average rating:', error);
            return { average: 0, count: 0 };
        }
    }

    private mapDocToReview(docSnap: FirebaseFirestoreTypes.QueryDocumentSnapshot): UserStoryReview {
        const data = docSnap.data();
        if (!data) {
            throw new Error('Document data is undefined');
        }
        return {
            id: docSnap.id,
            storyId: data.storyId,
            userId: data.userId,
            userName: data.userName,
            userAvatar: data.userAvatar,
            rating: data.rating,
            content: data.content,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            helpful: data.helpful || 0,
        };
    }
}

export const userStoryReviewService = new UserStoryReviewService();
