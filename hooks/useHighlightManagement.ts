import { useState, useCallback } from 'react';
import { useHighlightStore } from '@/store/highlightStore';
import { useAuthStore } from '@/store/authStore';
import { haptics } from '@/utils/haptics';

interface UseHighlightManagementProps {
    storyId: string | undefined;
    currentPage: number;
}

export function useHighlightManagement({ storyId, currentPage }: UseHighlightManagementProps) {
    const [showHighlightMenu, setShowHighlightMenu] = useState(false);
    const [highlightWord, setHighlightWord] = useState('');
    const [highlightBlockKey, setHighlightBlockKey] = useState('');

    const { user } = useAuthStore();
    const highlightActions = useHighlightStore((state) => state.actions);

    const handleWordLongPress = useCallback((word: string, blockKey: string) => {
        haptics.medium();
        setHighlightWord(word);
        setHighlightBlockKey(blockKey);
        setShowHighlightMenu(true);
    }, []);

    const addHighlight = useCallback((color: any) => {
        if (user && storyId) {
            highlightActions.addHighlight(user.id, {
                storyId,
                text: highlightWord,
                blockKey: highlightBlockKey,
                startOffset: 0,
                endOffset: highlightWord.length,
                color,
                pageIndex: currentPage,
            });
        }
        setShowHighlightMenu(false);
    }, [user, storyId, highlightWord, highlightBlockKey, currentPage, highlightActions]);

    return {
        showHighlightMenu,
        setShowHighlightMenu,
        highlightWord,
        handleWordLongPress,
        addHighlight,
    };
}
