import { create } from 'zustand';
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    getDocs,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp,
} from '@react-native-firebase/firestore';
import { LibraryItem, Story } from '@/types';
import { Result } from '@/types/api';
import { haptics } from '@/utils/haptics';

const db = getFirestore();

interface LibraryState {
    items: LibraryItem[];
    isLoading: boolean;
    error: string | null;
    userId: string | null;
}

interface LibraryActions {
    setUserId: (userId: string | null) => void;
    addToLibrary: (story: Story) => Promise<Result<LibraryItem>>;
    removeFromLibrary: (storyId: string) => Promise<Result<void>>;
    fetchLibrary: () => Promise<Result<LibraryItem[]>>;
    isInLibrary: (storyId: string) => boolean;
    clearLibrary: () => void;
}

const initialState: LibraryState = { items: [], isLoading: false, error: null, userId: null };

export const useLibraryStore = create<LibraryState & { actions: LibraryActions }>()((set, get) => ({
    ...initialState,
    actions: {
        setUserId: (userId) => { set({ userId }); if (userId) get().actions.fetchLibrary(); else set({ items: [] }); },
        addToLibrary: async (story) => {
            const { userId } = get();
            if (!userId) return { success: false, error: 'User not authenticated' };
            set({ isLoading: true, error: null });
            try {
                await setDoc(doc(collection(db, 'users', userId, 'library'), story.id), {
                    storyId: story.id, userId, addedAt: serverTimestamp(),
                    story: { id: story.id, title: story.title, description: story.description, coverImage: story.coverImage, author: story.author, difficulty: story.difficulty, estimatedReadTime: story.estimatedReadTime, wordCount: story.wordCount, tags: story.tags }
                });
                const newItem: LibraryItem = { storyId: story.id, userId, addedAt: new Date(), story };
                set((s) => ({ items: [...s.items, newItem], isLoading: false }));
                haptics.success();
                return { success: true, data: newItem };
            } catch (e) { const msg = e instanceof Error ? e.message : 'Failed'; set({ isLoading: false, error: msg }); return { success: false, error: msg }; }
        },
        removeFromLibrary: async (storyId) => {
            const { userId } = get();
            if (!userId) return { success: false, error: 'User not authenticated' };
            set({ isLoading: true, error: null });
            try { await deleteDoc(doc(collection(db, 'users', userId, 'library'), storyId)); set((s) => ({ items: s.items.filter((i) => i.storyId !== storyId), isLoading: false })); return { success: true, data: undefined }; }
            catch (e) { const msg = e instanceof Error ? e.message : 'Failed'; set({ isLoading: false, error: msg }); return { success: false, error: msg }; }
        },
        fetchLibrary: async () => {
            const { userId } = get();
            if (!userId) return { success: false, error: 'User not authenticated' };
            set({ isLoading: true, error: null });
            try {
                const q = query(collection(db, 'users', userId, 'library'), orderBy('addedAt', 'desc'));
                const snapshot = await getDocs(q);
                const items: LibraryItem[] = snapshot.docs.map((d: any) => { const data = d.data(); return { storyId: data.storyId, userId: data.userId, addedAt: data.addedAt?.toDate?.() || new Date(data.addedAt), story: data.story as Story, progress: data.progress }; });
                set({ items, isLoading: false });
                return { success: true, data: items };
            } catch (e) { const msg = e instanceof Error ? e.message : 'Failed'; set({ isLoading: false, error: msg }); return { success: false, error: msg }; }
        },
        isInLibrary: (storyId) => get().items.some((i) => i.storyId === storyId),
        clearLibrary: () => set({ items: [], userId: null }),
    },
}));
