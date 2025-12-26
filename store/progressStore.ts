import { create } from 'zustand';
import { getFirestore, collection, doc, setDoc, getDocs, query, where, serverTimestamp } from '@react-native-firebase/firestore';
import { ReadingProgress, DailyStat } from '@/types';
import { Result } from '@/types/api';
import { activityService } from '@/services/activityService';
import { communityService } from '@/services/communityService';
import { useAuthStore } from './authStore';
import { useSettingsStore } from './settingsStore';

const db = getFirestore();

interface ProgressState {
    progressMap: Record<string, ReadingProgress>;
    todayStats: DailyStat | null;
    isLoading: boolean;
    error: string | null;
    userId: string | null;
    totalReadingTimeMs: number;
}

interface ProgressActions {
    setUserId: (userId: string | null) => void;
    updateProgress: (storyId: string, position: number, percentage: number, storyTitle?: string, blockKey?: string, pageIndex?: number) => Promise<Result<ReadingProgress>>;
    markComplete: (storyId: string, storyTitle?: string, metadata?: any) => Promise<Result<ReadingProgress>>;
    saveQuizResult: (storyId: string, score: number, total: number) => Promise<Result<ReadingProgress>>;
    getProgress: (storyId: string) => ReadingProgress | undefined;
    fetchAllProgress: () => Promise<Result<Record<string, ReadingProgress>>>;
    fetchTodayStats: () => Promise<Result<DailyStat>>;
    getStreak: () => number;
    incrementReadingTime: (storyId: string, durationMs: number) => Promise<void>;
    checkSocialMilestones: () => Promise<void>;
    clearProgress: () => void;
}

const initialState: ProgressState = {
    progressMap: {},
    todayStats: null,
    isLoading: false,
    error: null,
    userId: null,
    totalReadingTimeMs: 0
};

export const useProgressStore = create<ProgressState & { actions: ProgressActions }>()((set, get) => ({
    ...initialState,
    actions: {
        setUserId: (userId) => {
            set({ userId });
            if (userId) {
                get().actions.fetchAllProgress();
                get().actions.fetchTodayStats();
            } else {
                set({ progressMap: {}, todayStats: null });
            }
        },
        updateProgress: async (storyId, position, percentage, _storyTitle = 'a story', blockKey?: string, pageIndex?: number) => {
            const { userId } = get();
            const user = useAuthStore.getState().user;
            if (!userId || !user) return { success: false, error: 'User not authenticated' };
            try {
                const progress: ReadingProgress = {
                    storyId,
                    userId,
                    currentPosition: position,
                    percentage,
                    lastReadAt: new Date(),
                    isCompleted: percentage >= 100,
                    lastBlockKey: blockKey,
                    lastPageIndex: pageIndex,
                };
                await setDoc(doc(collection(db, 'users', userId, 'progress'), storyId), { ...progress, lastReadAt: serverTimestamp() }, { merge: true });
                set((s) => ({ progressMap: { ...s.progressMap, [storyId]: progress } }));
                return { success: true, data: progress };
            } catch (e) {
                const msg = e instanceof Error ? e.message : 'Failed';
                set({ error: msg });
                return { success: false, error: msg };
            }
        },
        markComplete: async (storyId, _storyTitle = 'a story', _metadata) => {
            const { userId, progressMap } = get();
            const user = useAuthStore.getState().user;
            if (!userId || !user) return { success: false, error: 'User not authenticated' };
            try {
                const existing = progressMap[storyId];
                const progress: ReadingProgress = {
                    storyId,
                    userId,
                    currentPosition: existing?.currentPosition ?? 0,
                    percentage: 100,
                    lastReadAt: new Date(),
                    isCompleted: true
                };
                await setDoc(doc(collection(db, 'users', userId, 'progress'), storyId), { ...progress, lastReadAt: serverTimestamp() }, { merge: true });
                set((s) => ({ progressMap: { ...s.progressMap, [storyId]: progress } }));
                get().actions.checkSocialMilestones();
                return { success: true, data: progress };
            } catch (e) {
                const msg = e instanceof Error ? e.message : 'Failed';
                set({ error: msg });
                return { success: false, error: msg };
            }
        },
        saveQuizResult: async (storyId, score, total) => {
            const { userId, progressMap } = get();
            if (!userId) return { success: false, error: 'User not authenticated' };
            try {
                const existing = progressMap[storyId];
                const progress = {
                    ...existing,
                    storyId,
                    userId,
                    quizScore: score,
                    quizTotal: total,
                    lastReadAt: new Date()
                } as ReadingProgress;
                await setDoc(doc(collection(db, 'users', userId, 'progress'), storyId), { ...progress, lastReadAt: serverTimestamp() }, { merge: true });
                set((s) => ({ progressMap: { ...s.progressMap, [storyId]: progress } }));
                get().actions.checkSocialMilestones();
                return { success: true, data: progress };
            } catch (e) {
                const msg = e instanceof Error ? e.message : 'Failed';
                set({ error: msg });
                return { success: false, error: msg };
            }
        },
        getProgress: (storyId) => get().progressMap[storyId],
        fetchAllProgress: async () => {
            const { userId } = get();
            if (!userId) return { success: false, error: 'User not authenticated' };
            set({ isLoading: true, error: null });
            try {
                const snapshot = await getDocs(collection(db, 'users', userId, 'progress'));
                const progressMap: Record<string, ReadingProgress> = {};
                snapshot.docs.forEach((d: any) => {
                    const data = d.data();
                    progressMap[data.storyId] = {
                        storyId: data.storyId,
                        userId: data.userId,
                        currentPosition: data.currentPosition,
                        percentage: data.percentage,
                        lastReadAt: data.lastReadAt?.toDate?.() || new Date(data.lastReadAt),
                        isCompleted: data.isCompleted,
                        quizScore: data.quizScore,
                        quizTotal: data.quizTotal,
                        readingTimeMs: data.readingTimeMs || 0,
                        lastBlockKey: data.lastBlockKey,
                        lastPageIndex: data.lastPageIndex,
                    };
                });
                const totalReadingTimeMs = Object.values(progressMap).reduce((acc, p) => acc + (p.readingTimeMs || 0), 0);
                set({ progressMap, totalReadingTimeMs, isLoading: false });
                return { success: true, data: progressMap };
            } catch (e) {
                const msg = e instanceof Error ? e.message : 'Failed';
                set({ isLoading: false, error: msg });
                return { success: false, error: msg };
            }
        },
        fetchTodayStats: async () => {
            const { userId } = get();
            if (!userId) return { success: false, error: 'User not authenticated' };

            const today = new Date().toISOString().split('T')[0];
            const dailyGoal = useSettingsStore.getState().settings.dailyGoalMinutes;

            try {
                const docSnap = await getDocs(query(collection(db, 'users', userId, 'daily_stats'), where('date', '==', today)));

                if (!docSnap.empty) {
                    const data = docSnap.docs[0].data();
                    const stats: DailyStat = {
                        date: data.date,
                        minutesRead: data.minutesRead,
                        goalMinutes: data.goalMinutes,
                        isGoalReached: data.minutesRead >= data.goalMinutes,
                        lastUpdated: data.lastUpdated?.toDate?.() || new Date(data.lastUpdated),
                    };
                    set({ todayStats: stats });
                    return { success: true, data: stats };
                } else {
                    const newStats: DailyStat = {
                        date: today,
                        minutesRead: 0,
                        goalMinutes: dailyGoal,
                        isGoalReached: false,
                        lastUpdated: new Date(),
                    };
                    set({ todayStats: newStats });
                    return { success: true, data: newStats };
                }
            } catch (e) {
                console.error('Failed to fetch today stats:', e);
                return { success: false, error: 'Failed' };
            }
        },
        getStreak: () => {
            const { progressMap } = get();
            const allDates = Object.values(progressMap).filter(p => p.lastReadAt).map(p => new Date(p.lastReadAt).toISOString().split('T')[0]);
            if (allDates.length === 0) return 0;
            const uniqueDates = [...new Set(allDates)].sort().reverse();
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) return 0;
            let streak = 1;
            for (let i = 1; i < uniqueDates.length; i++) {
                const prevDate = new Date(uniqueDates[i - 1]);
                const currDate = new Date(uniqueDates[i]);
                const diffDays = Math.round((prevDate.getTime() - currDate.getTime()) / 86400000);
                if (diffDays === 1) streak++;
                else break;
            }
            return streak;
        },
        incrementReadingTime: async (storyId, durationMs) => {
            const { userId, progressMap, todayStats } = get();
            if (!userId) return;

            // Update story progress
            const existing = progressMap[storyId];
            const newTime = (existing?.readingTimeMs || 0) + durationMs;

            // Update today stats
            const durationMin = durationMs / 60000;
            const today = new Date().toISOString().split('T')[0];
            const dailyGoal = useSettingsStore.getState().settings.dailyGoalMinutes;

            const updatedTodayStats: DailyStat = todayStats && todayStats.date === today
                ? {
                    ...todayStats,
                    minutesRead: todayStats.minutesRead + durationMin,
                    isGoalReached: (todayStats.minutesRead + durationMin) >= todayStats.goalMinutes,
                    lastUpdated: new Date(),
                }
                : {
                    date: today,
                    minutesRead: durationMin,
                    goalMinutes: dailyGoal,
                    isGoalReached: durationMin >= dailyGoal,
                    lastUpdated: new Date(),
                };

            set((s) => ({
                totalReadingTimeMs: s.totalReadingTimeMs + durationMs,
                todayStats: updatedTodayStats,
                progressMap: {
                    ...s.progressMap,
                    [storyId]: {
                        ...(existing || { storyId, userId, currentPosition: 0, percentage: 0, isCompleted: false }),
                        readingTimeMs: newTime,
                        lastReadAt: new Date()
                    } as ReadingProgress
                }
            }));

            try {
                // Batch-ish write (not really a transaction but for simplicity)
                await Promise.all([
                    setDoc(doc(db, 'users', userId, 'progress', storyId), { readingTimeMs: newTime, lastReadAt: serverTimestamp() }, { merge: true }),
                    setDoc(doc(db, 'users', userId, 'daily_stats', today), {
                        ...updatedTodayStats,
                        lastUpdated: serverTimestamp()
                    }, { merge: true })
                ]);
            } catch (e) {
                console.error('Failed to sync reading time:', e);
            }
        },
        checkSocialMilestones: async () => {
            const { userId, progressMap } = get();
            const user = useAuthStore.getState().user;
            if (!userId || !user) return;
            const completedStories = Object.values(progressMap).filter(p => p.isCompleted).length;
            const streak = get().actions.getStreak();
            const reviewsCount = await communityService.getUserReviewCount(userId);
            await activityService.checkAndPostMilestones(userId, user.displayName || 'Anonymous', user.photoURL, { completedStories, streak, reviewsCount });
        },
        clearProgress: () => set({ ...initialState }),
    },
}));

