import { useState, useEffect, useRef, useCallback } from 'react';
import { PortableTextBlock } from '@portabletext/types';
import { useProgressStore } from '@/store/progressStore';
import { haptics } from '@/utils/haptics';

interface UseReadingProgressManagerProps {
    storyId: string | undefined;
    storyTitle: string | undefined;
    totalPages: number;
    pages: PortableTextBlock[][];
    findPageByBlockKey: (blockKey: string | undefined) => number;
    initialPercentage?: number;
}

export function useReadingProgressManager({
    storyId,
    storyTitle,
    totalPages,
    pages,
    findPageByBlockKey,
    initialPercentage = 0,
}: UseReadingProgressManagerProps) {
    const [progress, setProgress] = useState(initialPercentage);
    const [currentPage, setCurrentPage] = useState(0);
    const saveTimeoutRef = useRef<number | null>(null);
    const { progressMap, actions: progressActions } = useProgressStore();

    // Debounced save progress
    const saveProgress = useCallback((newProgress: number, blockKey?: string, pageIndex?: number) => {
        if (!storyId || !storyTitle) return;

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        saveTimeoutRef.current = setTimeout(() => {
            progressActions.updateProgress(storyId, 0, newProgress, storyTitle, blockKey, pageIndex);
        }, 1000) as unknown as number;
    }, [storyId, storyTitle, progressActions]);

    // Restore current page from saved progress when pages are calculated
    useEffect(() => {
        if (totalPages > 0 && storyId && progressMap[storyId]) {
            const savedProgress = progressMap[storyId];

            // Try to restore by block key first (Apple Books style)
            if (savedProgress.lastBlockKey) {
                const restoredPage = findPageByBlockKey(savedProgress.lastBlockKey);
                if (restoredPage >= 0 && currentPage === 0) {
                    setCurrentPage(restoredPage);
                    setProgress(savedProgress.percentage);
                    return;
                }
            }

            // Fallback to percentage-based restoration
            const percentageProgress = savedProgress.percentage;
            const restoredPage = Math.min(
                Math.floor((percentageProgress / 100) * totalPages),
                totalPages - 1
            );
            if (restoredPage > 0 && currentPage === 0) {
                setCurrentPage(restoredPage);
                setProgress(percentageProgress);
            }
        }
    }, [totalPages, storyId, progressMap, findPageByBlockKey]);

    // Handle page change
    const handlePageChange = useCallback((newPage: number) => {
        if (newPage === currentPage) return;

        setCurrentPage(newPage);

        // Get the key of the first block on the new page
        const firstBlockOnPage = pages[newPage]?.[0];
        const blockKey = firstBlockOnPage?._key;

        // Calculate progress based on page position
        const newProgress = totalPages > 0
            ? Math.min(100, Math.round(((newPage + 1) / totalPages) * 100))
            : 0;

        setProgress(newProgress);
        saveProgress(newProgress, blockKey, newPage);
    }, [currentPage, totalPages, pages, saveProgress]);

    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, []);

    return {
        progress,
        setProgress,
        currentPage,
        setCurrentPage,
        handlePageChange,
    };
}
