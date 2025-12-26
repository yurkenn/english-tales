import { useState, useRef, useCallback } from 'react';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { dictionaryService, DictionaryEntry } from '@/services/dictionary';
import { analyticsService } from '@/services/firebase/analytics';
import { haptics } from '@/utils/haptics';

interface UseDictionaryManagementProps {
    storyId: string | undefined;
}

export function useDictionaryManagement({ storyId }: UseDictionaryManagementProps) {
    const wordSheetRef = useRef<BottomSheetModal>(null);
    const [selectedWord, setSelectedWord] = useState('');
    const [dictionaryData, setDictionaryData] = useState<DictionaryEntry | null>(null);
    const [isWordLoading, setIsWordLoading] = useState(false);

    const handleWordPress = useCallback(async (word: string) => {
        const cleaned = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
        if (!cleaned) return;

        haptics.light();
        setSelectedWord(cleaned);
        setIsWordLoading(true);
        wordSheetRef.current?.present();

        const data = await dictionaryService.lookup(cleaned);
        setDictionaryData(data);
        setIsWordLoading(false);

        analyticsService.logEvent('word_lookup', {
            word: cleaned,
            story_id: storyId
        });
    }, [storyId]);

    return {
        wordSheetRef,
        selectedWord,
        dictionaryData,
        isWordLoading,
        handleWordPress,
    };
}
