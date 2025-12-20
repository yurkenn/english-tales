/**
 * Review Service - Native Firebase Firestore Modular API
 */
import {
    getFirestore,
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    setDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
} from '@react-native-firebase/firestore';
import { StoryReview, UserFavorite } from '@/types';
import { Result } from '@/types/api';
import { communityService } from './communityService';

const db = getFirestore();

class ReviewService {
    private REVIEWS_COLLECTION = 'reviews';
    private FAVORITES_COLLECTION = 'favorites';

    async addReview(
        storyId: string,
        storyTitle: string,
        userId: string,
        userName: string,
        userPhoto: string | null,
        rating: number,
        comment: string
    ): Promise<Result<string>> {
        try {
            const reviewData = {
                storyId,
                storyTitle,
                userId,
                userName,
                userPhoto,
                rating,
                comment,
                timestamp: serverTimestamp(),
                likes: 0,
                likedBy: [] as string[],
            };

            const docRef = await addDoc(collection(db, this.REVIEWS_COLLECTION), reviewData);

            await communityService.createPost(
                userId,
                userName,
                userPhoto,
                comment,
                'story_review',
                { storyId, storyTitle, rating }
            );

            return { success: true, data: docRef.id };
        } catch (error) {
            console.error('Error adding review:', error);
            return { success: false, error: 'Failed to add review' };
        }
    }

    async getStoryReviews(storyId: string): Promise<Result<StoryReview[]>> {
        try {
            const q = query(
                collection(db, this.REVIEWS_COLLECTION),
                where('storyId', '==', storyId),
                orderBy('timestamp', 'desc')
            );

            const snapshot = await getDocs(q);
            const reviews = snapshot.docs.map((d: any) => ({
                id: d.id,
                ...d.data()
            } as StoryReview));

            return { success: true, data: reviews };
        } catch (error) {
            console.error('Error getting story reviews:', error);
            return { success: false, error: 'Failed' };
        }
    }

    async getUserReviews(userId: string): Promise<Result<StoryReview[]>> {
        try {
            const q = query(
                collection(db, this.REVIEWS_COLLECTION),
                where('userId', '==', userId),
                orderBy('timestamp', 'desc')
            );

            const snapshot = await getDocs(q);
            const reviews = snapshot.docs.map((d: any) => ({
                id: d.id,
                ...d.data()
            } as StoryReview));

            return { success: true, data: reviews };
        } catch (error) {
            console.error('Error getting user reviews:', error);
            return { success: false, error: 'Failed' };
        }
    }

    async toggleFavorite(
        userId: string,
        storyId: string,
        storyTitle: string,
        storyCover: string
    ): Promise<Result<boolean>> {
        try {
            const favoriteId = `${userId}_${storyId}`;
            const docRef = doc(db, this.FAVORITES_COLLECTION, favoriteId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                await deleteDoc(docRef);
                return { success: true, data: false };
            } else {
                const favoriteData: UserFavorite = {
                    id: favoriteId,
                    userId,
                    storyId,
                    storyTitle,
                    storyCover,
                    addedAt: serverTimestamp(),
                };
                await setDoc(docRef, favoriteData);
                return { success: true, data: true };
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            return { success: false, error: 'Failed' };
        }
    }

    async getUserFavorites(userId: string): Promise<Result<UserFavorite[]>> {
        try {
            const q = query(
                collection(db, this.FAVORITES_COLLECTION),
                where('userId', '==', userId),
                orderBy('addedAt', 'desc')
            );

            const snapshot = await getDocs(q);
            const favorites = snapshot.docs.map((d: any) => d.data() as UserFavorite);
            return { success: true, data: favorites };
        } catch (error) {
            console.error('Error getting user favorites:', error);
            return { success: false, error: 'Failed' };
        }
    }

    async isFavorited(userId: string, storyId: string): Promise<Result<boolean>> {
        try {
            const favoriteId = `${userId}_${storyId}`;
            const docSnap = await getDoc(doc(db, this.FAVORITES_COLLECTION, favoriteId));
            return { success: true, data: docSnap.exists() };
        } catch {
            return { success: false, error: 'Failed' };
        }
    }
}

export const reviewService = new ReviewService();
