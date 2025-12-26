import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink'

export interface Highlight {
    id: string
    storyId: string
    text: string
    blockKey: string // Portable text block _key
    startOffset: number
    endOffset: number
    color: HighlightColor
    createdAt: number
    pageIndex?: number
}

interface HighlightState {
    // Record<userId, Record<storyId, Highlight[]>>
    highlights: Record<string, Record<string, Highlight[]>>
    actions: {
        addHighlight: (userId: string, highlight: Omit<Highlight, 'id' | 'createdAt'>) => string
        removeHighlight: (userId: string, storyId: string, highlightId: string) => void
        updateHighlightColor: (userId: string, storyId: string, highlightId: string, color: HighlightColor) => void
        getHighlightsForStory: (userId: string, storyId: string) => Highlight[]
        getAllHighlights: (userId: string) => Highlight[]
        clearAll: () => void
    }
}

export const useHighlightStore = create<HighlightState>()(
    persist(
        (set, get) => ({
            highlights: {},

            actions: {
                addHighlight: (userId, highlightData) => {
                    const id = `hl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                    const highlight: Highlight = {
                        ...highlightData,
                        id,
                        createdAt: Date.now(),
                    }

                    set((state) => {
                        const userHighlights = state.highlights[userId] || {}
                        const storyHighlights = userHighlights[highlightData.storyId] || []

                        return {
                            highlights: {
                                ...state.highlights,
                                [userId]: {
                                    ...userHighlights,
                                    [highlightData.storyId]: [...storyHighlights, highlight],
                                },
                            },
                        }
                    })

                    return id
                },

                removeHighlight: (userId, storyId, highlightId) => {
                    set((state) => {
                        const userHighlights = state.highlights[userId] || {}
                        const storyHighlights = userHighlights[storyId] || []

                        return {
                            highlights: {
                                ...state.highlights,
                                [userId]: {
                                    ...userHighlights,
                                    [storyId]: storyHighlights.filter((h) => h.id !== highlightId),
                                },
                            },
                        }
                    })
                },

                updateHighlightColor: (userId, storyId, highlightId, color) => {
                    set((state) => {
                        const userHighlights = state.highlights[userId] || {}
                        const storyHighlights = userHighlights[storyId] || []

                        return {
                            highlights: {
                                ...state.highlights,
                                [userId]: {
                                    ...userHighlights,
                                    [storyId]: storyHighlights.map((h) =>
                                        h.id === highlightId ? { ...h, color } : h
                                    ),
                                },
                            },
                        }
                    })
                },

                getHighlightsForStory: (userId, storyId) => {
                    const state = get()
                    return state.highlights[userId]?.[storyId] || []
                },

                getAllHighlights: (userId) => {
                    const state = get()
                    const userHighlights = state.highlights[userId] || {}
                    return Object.values(userHighlights)
                        .flat()
                        .sort((a, b) => b.createdAt - a.createdAt)
                },

                clearAll: () => {
                    set({ highlights: {} })
                },
            },
        }),
        {
            name: 'highlight-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ highlights: state.highlights }),
        }
    )
)

// Color constants for UI
export const HIGHLIGHT_COLORS: Record<HighlightColor, string> = {
    yellow: 'rgba(255, 235, 59, 0.4)',
    green: 'rgba(76, 175, 80, 0.4)',
    blue: 'rgba(33, 150, 243, 0.4)',
    pink: 'rgba(233, 30, 99, 0.4)',
}

export const HIGHLIGHT_COLOR_SOLID: Record<HighlightColor, string> = {
    yellow: '#FFEB3B',
    green: '#4CAF50',
    blue: '#2196F3',
    pink: '#E91E63',
}
