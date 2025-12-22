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
    userId: string; // Add userId to associate word with owner
}

interface VocabularyState {
    savedWords: Record<string, Record<string, SavedWord>>; // Record<userId, Record<wordId, SavedWord>>
    actions: {
        saveWord: (word: SavedWord) => void;
        removeWord: (userId: string, wordId: string) => void;
        isWordSaved: (userId: string, wordId: string) => boolean;
        getWordsForUser: (userId: string) => SavedWord[];
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
                    const userId = word.userId;
                    set((state) => ({
                        savedWords: {
                            ...state.savedWords,
                            [userId]: {
                                ...(state.savedWords[userId] || {}),
                                [wordId]: { ...word, id: wordId }
                            }
                        }
                    }));
                },

                removeWord: (userId, wordId) => {
                    const id = wordId.toLowerCase();
                    set((state) => {
                        const userWords = { ...(state.savedWords[userId] || {}) };
                        delete userWords[id];
                        return {
                            savedWords: {
                                ...state.savedWords,
                                [userId]: userWords
                            }
                        };
                    });
                },

                isWordSaved: (userId, wordId) => {
                    return !!get().savedWords[userId]?.[wordId.toLowerCase()];
                },

                getWordsForUser: (userId) => {
                    const words = get().savedWords[userId] || {};
                    return Object.values(words).sort((a, b) => b.addedAt - a.addedAt);
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
