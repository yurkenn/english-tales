import { create } from 'zustand';
import { ReadingProgress } from '@/types';
import { Result } from '@/types/api';
import { db } from '@/services/firebase/config';
import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';

// State
interface ProgressState {
    progressMap: Record<string, ReadingProgress>; // keyed by storyId
    isLoading: boolean;
    error: string | null;
    userId: string | null;
    totalReadingTimeMs: number;
}

// Actions
interface ProgressActions {
    setUserId: (userId: string | null) => void;
    updateProgress: (storyId: string, position: number, percentage: number) => Promise<Result<ReadingProgress>>;
    markComplete: (storyId: string) => Promise<Result<ReadingProgress>>;
    saveQuizResult: (storyId: string, score: number, total: number) => Promise<Result<ReadingProgress>>;
    getProgress: (storyId: string) => ReadingProgress | undefined;
    fetchAllProgress: () => Promise<Result<Record<string, ReadingProgress>>>;
    getStreak: () => number;
    incrementReadingTime: (storyId: string, durationMs: number) => Promise<void>;
    clearProgress: () => void;
}

// Initial state
const initialState: ProgressState = {
    progressMap: {},
    isLoading: false,
    error: null,
    userId: null,
    totalReadingTimeMs: 0,
};

export const useProgressStore = create<ProgressState & { actions: ProgressActions }>()((set, get) => ({
    ...initialState,

    actions: {
        setUserId: (userId) => {
            set({ userId });
            // Auto-fetch when userId is set
            if (userId) {
                get().actions.fetchAllProgress();
            } else {
                set({ progressMap: {} });
            }
        },

        updateProgress: async (storyId, position, percentage) => {
            const { userId } = get();
            if (!userId) {
                return { success: false, error: 'User not authenticated' };
            }

            try {
                const progressRef = doc(db, 'users', userId, 'progress', storyId);

                const progress: ReadingProgress = {
                    storyId,
                    userId,
                    currentPosition: position,
                    percentage,
                    lastReadAt: new Date(),
                    isCompleted: percentage >= 100,
                };

                await setDoc(progressRef, {
                    ...progress,
                    lastReadAt: serverTimestamp(),
                }, { merge: true });

                set((state) => ({
                    progressMap: {
                        ...state.progressMap,
                        [storyId]: progress,
                    },
                }));

                return { success: true, data: progress };
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to update progress';
                set({ error: message });
                return { success: false, error: message };
            }
        },

        markComplete: async (storyId) => {
            const { userId, progressMap } = get();
            if (!userId) {
                return { success: false, error: 'User not authenticated' };
            }

            try {
                const existing = progressMap[storyId];
                const progressRef = doc(db, 'users', userId, 'progress', storyId);

                const progress: ReadingProgress = {
                    storyId,
                    userId,
                    currentPosition: existing?.currentPosition ?? 0,
                    percentage: 100,
                    lastReadAt: new Date(),
                    isCompleted: true,
                };

                await setDoc(progressRef, {
                    ...progress,
                    lastReadAt: serverTimestamp(),
                }, { merge: true });

                set((state) => ({
                    progressMap: {
                        ...state.progressMap,
                        [storyId]: progress,
                    },
                }));

                return { success: true, data: progress };
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to mark complete';
                set({ error: message });
                return { success: false, error: message };
            }
        },

        saveQuizResult: async (storyId, score, total) => {
            const { userId, progressMap } = get();
            if (!userId) {
                return { success: false, error: 'User not authenticated' };
            }

            try {
                const existing = progressMap[storyId];
                const progressRef = doc(db, 'users', userId, 'progress', storyId);

                const progress: ReadingProgress = {
                    ...existing,
                    storyId,
                    userId,
                    quizScore: score,
                    quizTotal: total,
                    lastReadAt: new Date(),
                } as ReadingProgress;

                await setDoc(progressRef, {
                    ...progress,
                    lastReadAt: serverTimestamp(),
                }, { merge: true });

                set((state) => ({
                    progressMap: {
                        ...state.progressMap,
                        [storyId]: progress,
                    },
                }));

                return { success: true, data: progress };
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to save quiz result';
                set({ error: message });
                return { success: false, error: message };
            }
        },

        getProgress: (storyId) => {
            return get().progressMap[storyId];
        },

        fetchAllProgress: async () => {
            const { userId } = get();
            if (!userId) {
                return { success: false, error: 'User not authenticated' };
            }

            set({ isLoading: true, error: null });
            try {
                const progressRef = collection(db, 'users', userId, 'progress');
                const snapshot = await getDocs(progressRef);

                const progressMap: Record<string, ReadingProgress> = {};
                snapshot.docs.forEach((docSnap) => {
                    const data = docSnap.data();
                    progressMap[data.storyId] = {
                        storyId: data.storyId,
                        userId: data.userId,
                        currentPosition: data.currentPosition,
                        percentage: data.percentage,
                        lastReadAt: data.lastReadAt instanceof Timestamp
                            ? data.lastReadAt.toDate()
                            : new Date(data.lastReadAt),
                        isCompleted: data.isCompleted,
                        quizScore: data.quizScore,
                        quizTotal: data.quizTotal,
                        readingTimeMs: data.readingTimeMs || 0,
                    };
                });

                const totalReadingTimeMs = Object.values(progressMap).reduce(
                    (acc, p) => acc + (p.readingTimeMs || 0),
                    0
                );

                set({ progressMap, totalReadingTimeMs, isLoading: false });
                return { success: true, data: progressMap };
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to fetch progress';
                set({ isLoading: false, error: message });
                return { success: false, error: message };
            }
        },

        getStreak: () => {
            const { progressMap } = get();
            const allDates = Object.values(progressMap)
                .filter((p) => p.lastReadAt)
                .map((p) => {
                    const date = p.lastReadAt;
                    // Normalize to date string (YYYY-MM-DD)
                    return new Date(date).toISOString().split('T')[0];
                });

            if (allDates.length === 0) return 0;

            // Get unique dates and sort descending
            const uniqueDates = [...new Set(allDates)].sort().reverse();

            // Check if user read today or yesterday
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

            if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
                return 0; // Streak broken
            }

            // Count consecutive days
            let streak = 1;
            for (let i = 1; i < uniqueDates.length; i++) {
                const prevDate = new Date(uniqueDates[i - 1]);
                const currDate = new Date(uniqueDates[i]);
                const diffDays = Math.round((prevDate.getTime() - currDate.getTime()) / 86400000);

                if (diffDays === 1) {
                    streak++;
                } else {
                    break;
                }
            }

            return streak;
        },

        incrementReadingTime: async (storyId, durationMs) => {
            const { userId, progressMap } = get();
            if (!userId) return;

            const existing = progressMap[storyId];
            const newTime = (existing?.readingTimeMs || 0) + durationMs;

            // Optimistic update
            set((state) => ({
                totalReadingTimeMs: state.totalReadingTimeMs + durationMs,
                progressMap: {
                    ...state.progressMap,
                    [storyId]: {
                        ...(existing || {
                            storyId,
                            userId,
                            currentPosition: 0,
                            percentage: 0,
                            isCompleted: false,
                        }),
                        readingTimeMs: newTime,
                        lastReadAt: new Date(),
                    } as ReadingProgress,
                },
            }));

            // Sync to Firebase
            try {
                const progressRef = doc(db, 'users', userId, 'progress', storyId);
                await setDoc(progressRef, {
                    readingTimeMs: newTime,
                    lastReadAt: serverTimestamp(),
                }, { merge: true });
            } catch (error) {
                console.error('Failed to sync reading time to Firebase:', error);
            }
        },

        clearProgress: () => set({ ...initialState }),
    },
}));
