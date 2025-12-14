import { create } from 'zustand';
import { LibraryItem, Story } from '@/types';
import { Result } from '@/types/api';
import { db } from '@/services/firebase/config';
import {
    collection,
    doc,
    setDoc,
    deleteDoc,
    getDocs,
    query,
    orderBy,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { haptics } from '@/utils/haptics';

// State
interface LibraryState {
    items: LibraryItem[];
    isLoading: boolean;
    error: string | null;
    userId: string | null;
}

// Actions
interface LibraryActions {
    setUserId: (userId: string | null) => void;
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
    userId: null,
};

export const useLibraryStore = create<LibraryState & { actions: LibraryActions }>()((set, get) => ({
    ...initialState,

    actions: {
        setUserId: (userId) => {
            set({ userId });
            // Auto-fetch when userId is set
            if (userId) {
                get().actions.fetchLibrary();
            } else {
                set({ items: [] });
            }
        },

        addToLibrary: async (story) => {
            const { userId } = get();
            if (!userId) {
                return { success: false, error: 'User not authenticated' };
            }

            set({ isLoading: true, error: null });
            try {
                const libraryRef = doc(db, 'users', userId, 'library', story.id);

                const libraryDoc = {
                    storyId: story.id,
                    userId,
                    addedAt: serverTimestamp(),
                    story: {
                        id: story.id,
                        title: story.title,
                        description: story.description,
                        coverImage: story.coverImage,
                        author: story.author,
                        difficulty: story.difficulty,
                        estimatedReadTime: story.estimatedReadTime,
                        wordCount: story.wordCount,
                        tags: story.tags,
                    },
                };

                await setDoc(libraryRef, libraryDoc);

                const newItem: LibraryItem = {
                    storyId: story.id,
                    userId,
                    addedAt: new Date(),
                    story,
                };

                set((state) => ({
                    items: [...state.items, newItem],
                    isLoading: false,
                }));

                haptics.success();
                return { success: true, data: newItem };
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to add to library';
                set({ isLoading: false, error: message });
                return { success: false, error: message };
            }
        },

        removeFromLibrary: async (storyId) => {
            const { userId } = get();
            if (!userId) {
                return { success: false, error: 'User not authenticated' };
            }

            set({ isLoading: true, error: null });
            try {
                const libraryRef = doc(db, 'users', userId, 'library', storyId);
                await deleteDoc(libraryRef);

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
            const { userId } = get();
            if (!userId) {
                return { success: false, error: 'User not authenticated' };
            }

            set({ isLoading: true, error: null });
            try {
                const libraryRef = collection(db, 'users', userId, 'library');
                const q = query(libraryRef, orderBy('addedAt', 'desc'));
                const snapshot = await getDocs(q);

                const items: LibraryItem[] = snapshot.docs.map((docSnap) => {
                    const data = docSnap.data();
                    return {
                        storyId: data.storyId,
                        userId: data.userId,
                        addedAt: data.addedAt instanceof Timestamp
                            ? data.addedAt.toDate()
                            : new Date(data.addedAt),
                        story: data.story as Story,
                        progress: data.progress,
                    };
                });

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

        clearLibrary: () => set({ items: [], userId: null }),
    },
}));
