import { db } from './firebase/config';
import {
    doc,
    setDoc,
    getDoc,
    collection,
    query,
    orderBy,
    limit,
    getDocs,
    serverTimestamp,
} from 'firebase/firestore';
import { ReadingProgress, User } from '@/types';
import { Result } from '@/types/api';

export interface LeaderboardEntry {
    userId: string;
    displayName: string;
    photoURL: string | null;
    totalWordsRead: number;
    totalReadingTimeMs: number;
    averageQuizScore: number;
    completedStoriesCount: number;
    streak: number;
    lastSyncAt: Date;
}

class LeaderboardService {
    private COLLECTION = 'leaderboard';

    /**
     * Synchronizes a user's stats to the global leaderboard
     */
    async syncUserStats(
        user: User,
        progressMap: Record<string, ReadingProgress>,
        stories: Record<string, { wordCount: number }>,
        streak: number
    ): Promise<Result<void>> {
        try {
            const progressArray = Object.values(progressMap);

            let totalWordsRead = 0;
            let totalReadingTimeMs = 0;
            let totalQuizScore = 0;
            let quizCount = 0;
            let completedStoriesCount = 0;

            progressArray.forEach(p => {
                const storyData = stories[p.storyId];
                if (p.isCompleted) {
                    completedStoriesCount++;
                    if (storyData) {
                        totalWordsRead += storyData.wordCount;
                    }
                } else if (p.percentage > 0 && storyData) {
                    // Approximate words read for partial progress
                    totalWordsRead += Math.floor((p.percentage / 100) * storyData.wordCount);
                }

                totalReadingTimeMs += (p.readingTimeMs || 0);

                if (p.quizScore !== undefined && p.quizTotal !== undefined) {
                    totalQuizScore += (p.quizScore / p.quizTotal);
                    quizCount++;
                }
            });

            const entry: Omit<LeaderboardEntry, 'lastSyncAt'> = {
                userId: user.id,
                displayName: user.displayName || 'Anonymous Reader',
                photoURL: user.photoURL,
                totalWordsRead,
                totalReadingTimeMs,
                completedStoriesCount,
                averageQuizScore: quizCount > 0 ? (totalQuizScore / quizCount) * 100 : 0,
                streak,
            };

            await setDoc(doc(db, this.COLLECTION, user.id), {
                ...entry,
                lastSyncAt: serverTimestamp(),
            }, { merge: true });

            return { success: true, data: undefined };
        } catch (error) {
            console.error('Leaderboard sync failed:', error);
            return { success: false, error: 'Failed to sync leaderboard stats' };
        }
    }

    /**
     * Fetches the top readers
     */
    async getTopReaders(limitCount = 20): Promise<Result<LeaderboardEntry[]>> {
        try {
            const q = query(
                collection(db, this.COLLECTION),
                orderBy('totalWordsRead', 'desc'),
                limit(limitCount)
            );

            const snapshot = await getDocs(q);
            const entries: LeaderboardEntry[] = snapshot.docs.map(docSnap => {
                const data = docSnap.data();
                return {
                    ...data,
                    lastSyncAt: data.lastSyncAt?.toDate() || new Date(),
                } as LeaderboardEntry;
            });

            return { success: true, data: entries };
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error);
            return { success: false, error: 'Failed to fetch rankings' };
        }
    }
}

export const leaderboardService = new LeaderboardService();
