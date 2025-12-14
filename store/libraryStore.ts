import { create } from 'zustand';
import { LibraryItem, Story } from '@/types';
import { Result } from '@/types/api';

// State
interface LibraryState {
    items: LibraryItem[];
    isLoading: boolean;
    error: string | null;
}

// Actions
interface LibraryActions {
    addToLibrary: (story: Story) => Promise<Result<LibraryItem>>;
    removeFromLibrary: (storyId: string) => Promise<Result<void>>;
    fetchLibrary: () => Promise<Result<LibraryItem[]>>;
    isInLibrary: (storyId: string) => boolean;
    clearLibrary: () => void;
}

// Initial state
const initialState: LibraryState = {
    items: [],
    isLoading: false,
    error: null,
};

export const useLibraryStore = create<LibraryState & { actions: LibraryActions }>()((set, get) => ({
    ...initialState,

    actions: {
        addToLibrary: async (story) => {
            set({ isLoading: true, error: null });
            try {
                // TODO: Add Firebase integration
                const newItem: LibraryItem = {
                    storyId: story.id,
                    userId: '', // Will be set from auth
                    addedAt: new Date(),
                    story,
                };
                set((state) => ({
                    items: [...state.items, newItem],
                    isLoading: false,
                }));
                return { success: true, data: newItem };
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to add to library';
                set({ isLoading: false, error: message });
                return { success: false, error: message };
            }
        },

        removeFromLibrary: async (storyId) => {
            set({ isLoading: true, error: null });
            try {
                // TODO: Add Firebase integration
                set((state) => ({
                    items: state.items.filter((item) => item.storyId !== storyId),
                    isLoading: false,
                }));
                return { success: true, data: undefined };
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to remove from library';
                set({ isLoading: false, error: message });
                return { success: false, error: message };
            }
        },

        fetchLibrary: async () => {
            set({ isLoading: true, error: null });
            try {
                // TODO: Add Firebase integration
                const items: LibraryItem[] = [];
                set({ items, isLoading: false });
                return { success: true, data: items };
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to fetch library';
                set({ isLoading: false, error: message });
                return { success: false, error: message };
            }
        },

        isInLibrary: (storyId) => {
            return get().items.some((item) => item.storyId === storyId);
        },

        clearLibrary: () => set({ items: [] }),
    },
}));
