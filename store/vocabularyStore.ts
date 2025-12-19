import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SavedWord {
    id: string; // the word itself or unique id
    word: string;
    definition: string;
    example?: string;
    partOfSpeech?: string;
    addedAt: number;
    storyId?: string; // which story it was learned from
    storyTitle?: string;
}

interface VocabularyState {
    savedWords: Record<string, SavedWord>;
    actions: {
        saveWord: (word: SavedWord) => void;
        removeWord: (wordId: string) => void;
        isWordSaved: (wordId: string) => boolean;
        clearAll: () => void;
    };
}

export const useVocabularyStore = create<VocabularyState>()(
    persist(
        (set, get) => ({
            savedWords: {},

            actions: {
                saveWord: (word) => {
                    const wordId = word.word.toLowerCase();
                    set((state) => ({
                        savedWords: {
                            ...state.savedWords,
                            [wordId]: { ...word, id: wordId }
                        }
                    }));
                },

                removeWord: (wordId) => {
                    const id = wordId.toLowerCase();
                    set((state) => {
                        const { [id]: _, ...rest } = state.savedWords;
                        return { savedWords: rest };
                    });
                },

                isWordSaved: (wordId) => {
                    return !!get().savedWords[wordId.toLowerCase()];
                },

                clearAll: () => {
                    set({ savedWords: {} });
                }
            }
        }),
        {
            name: 'vocabulary-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ savedWords: state.savedWords }),
        }
    )
);
