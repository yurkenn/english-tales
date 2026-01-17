import { useMemo } from 'react';
import { useLibraryStore } from '@/store/libraryStore';
import { useProgressStore } from '@/store/progressStore';
import { useVocabularyStore } from '@/store/vocabularyStore';
import type { LibraryItemWithProgress } from '@/components/molecules/moleculeTypes';

interface LibraryStats {
    total: number;
    completed: number;
    inProgress: number;
}

interface UseLibraryDataResult {
    libraryWithProgress: LibraryItemWithProgress[];
    stats: LibraryStats;
    wordList: any[];
    isLoading: boolean;
    libraryActions: any;
    progressActions: any;
    vocabActions: any;
}

/**
 * Custom hook for library data management.
 */
export function useLibraryData(userId: string | undefined): UseLibraryDataResult {
    const { items: libraryItems, isLoading, actions: libraryActions } = useLibraryStore();
    const { progressMap, actions: progressActions } = useProgressStore();
    const savedWordsForUser = useVocabularyStore((s) => s.savedWords[userId || ''] || {});
    const vocabActions = useVocabularyStore((s) => s.actions);

    // Merge progress with library items
    const libraryWithProgress = useMemo<LibraryItemWithProgress[]>(() => {
        return libraryItems.map((item) => ({
            ...item,
            progress: progressMap[item.storyId]
                ? {
                    percentage: progressMap[item.storyId].percentage,
                    isCompleted: progressMap[item.storyId].isCompleted,
                }
                : undefined,
        }));
    }, [libraryItems, progressMap]);

    // Stats
    const stats = useMemo<LibraryStats>(() => {
        const total = libraryWithProgress.length;
        const completed = libraryWithProgress.filter((i) => i.progress?.isCompleted).length;
        const inProgress = libraryWithProgress.filter((i) => i.progress && !i.progress.isCompleted).length;
        return { total, completed, inProgress };
    }, [libraryWithProgress]);

    // Vocabulary word list
    const wordList = useMemo(
        () => Object.values(savedWordsForUser).sort((a, b) => b.addedAt - a.addedAt),
        [savedWordsForUser]
    );

    return {
        libraryWithProgress,
        stats,
        wordList,
        isLoading,
        libraryActions,
        progressActions,
        vocabActions,
    };
}
