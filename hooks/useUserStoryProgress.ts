import { useState, useCallback, useEffect, useRef } from 'react';
import { userStoryProgressService, UserStoryProgress } from '@/services/userStoryProgressService';
import { useAuthStore } from '@/store/authStore';

interface UseUserStoryProgressResult {
    progress: UserStoryProgress | null;
    isLoading: boolean;
    saveProgress: (currentPage: number, totalPages: number) => Promise<void>;
    markCompleted: (totalPages: number) => Promise<void>;
}

export function useUserStoryProgress(storyId: string | undefined): UseUserStoryProgressResult {
    const { user } = useAuthStore();
    const [progress, setProgress] = useState<UserStoryProgress | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!storyId || !user) {
            setIsLoading(false);
            return;
        }

        const loadProgress = async () => {
            setIsLoading(true);
            try {
                const existingProgress = await userStoryProgressService.getProgress(storyId, user.id);
                setProgress(existingProgress);
            } catch (error) {
                console.error('Error loading progress:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadProgress();
    }, [storyId, user]);

    // Debounced save to avoid too many writes
    const saveProgress = useCallback(async (currentPage: number, totalPages: number) => {
        if (!storyId || !user) return;

        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Update local state immediately
        const progressPercent = Math.round((currentPage / totalPages) * 100);
        setProgress((prev) => ({
            ...prev,
            id: prev?.id || '',
            storyId,
            userId: user.id,
            currentPage,
            totalPages,
            progressPercent,
            lastReadAt: new Date(),
            isCompleted: currentPage >= totalPages,
        }));

        // Debounce the actual save
        saveTimeoutRef.current = setTimeout(async () => {
            try {
                await userStoryProgressService.saveProgress(storyId, user.id, currentPage, totalPages);
            } catch (error) {
                console.error('Error saving progress:', error);
            }
        }, 1000);
    }, [storyId, user]);

    const markCompleted = useCallback(async (totalPages: number) => {
        if (!storyId || !user) return;

        try {
            await userStoryProgressService.markCompleted(storyId, user.id, totalPages);
            setProgress((prev) => ({
                ...prev,
                id: prev?.id || '',
                storyId,
                userId: user.id,
                currentPage: totalPages,
                totalPages,
                progressPercent: 100,
                lastReadAt: new Date(),
                isCompleted: true,
            }));
        } catch (error) {
            console.error('Error marking completed:', error);
        }
    }, [storyId, user]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    return {
        progress,
        isLoading,
        saveProgress,
        markCompleted,
    };
}
