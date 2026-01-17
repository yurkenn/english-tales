import { create } from 'zustand';

export interface UserStory {
    _id: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    title: string;
    description: string;
    coverImage?: {
        _type: 'image';
        asset: {
            _ref: string;
            _type: 'reference';
        };
    };
    coverImageUrl?: string;
    content: any[]; // Portable Text blocks
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    categories: Array<{
        _id: string;
        title: string;
        slug: { current: string };
        color?: string;
    }>;
    status: 'draft' | 'pending' | 'approved' | 'rejected' | 'revision_requested';
    isPublished: boolean;
    submittedAt?: string;
    reviewedAt?: string;
    reviewerNotes?: string;
    wordCount?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateUserStoryInput {
    title: string;
    description: string;
    content: any[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    categoryIds: string[];
    coverImageAssetId?: string;
    status?: 'draft' | 'pending';
}

export interface UpdateUserStoryInput {
    title?: string;
    description?: string;
    content?: any[];
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    categoryIds?: string[];
    coverImageAssetId?: string;
    status?: 'draft' | 'pending';
}

interface DraftState {
    title: string;
    description: string;
    content: any[];
    difficulty: 'beginner' | 'intermediate' | 'advanced' | null;
    categoryIds: string[];
    coverImageUri?: string;
    lastAutoSaved?: Date;
}

interface UserStoryStore {
    // Data
    stories: UserStory[];
    currentEditingId: string | null;
    isLoading: boolean;
    isSubmitting: boolean;
    error: string | null;

    // Draft state for new story creation
    draft: DraftState;

    // Computed
    drafts: () => UserStory[];
    published: () => UserStory[];
    pending: () => UserStory[];

    // Actions
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setStories: (stories: UserStory[]) => void;
    setCurrentEditingId: (id: string | null) => void;

    // Draft actions
    updateDraft: (updates: Partial<DraftState>) => void;
    clearDraft: () => void;

    // CRUD actions (to be connected to Sanity)
    addStory: (story: UserStory) => void;
    updateStory: (id: string, updates: Partial<UserStory>) => void;
    removeStory: (id: string) => void;

    // Submission
    setSubmitting: (submitting: boolean) => void;
}

const initialDraft: DraftState = {
    title: '',
    description: '',
    content: [],
    difficulty: null,
    categoryIds: [],
    coverImageUri: undefined,
    lastAutoSaved: undefined,
};

export const useUserStoryStore = create<UserStoryStore>((set, get) => ({
    // Initial state
    stories: [],
    currentEditingId: null,
    isLoading: false,
    isSubmitting: false,
    error: null,
    draft: initialDraft,

    // Computed getters
    drafts: () => get().stories.filter(s => s.status === 'draft'),
    published: () => get().stories.filter(s => s.isPublished),
    pending: () => get().stories.filter(s => s.status === 'pending'),

    // Setters
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
    setStories: (stories) => set({ stories }),
    setCurrentEditingId: (id) => set({ currentEditingId: id }),

    // Draft actions
    updateDraft: (updates) => set((state) => ({
        draft: {
            ...state.draft,
            ...updates,
            lastAutoSaved: new Date(),
        },
    })),

    clearDraft: () => set({ draft: initialDraft }),

    // CRUD actions
    addStory: (story) => set((state) => ({
        stories: [story, ...state.stories],
    })),

    updateStory: (id, updates) => set((state) => ({
        stories: state.stories.map((s) =>
            s._id === id ? { ...s, ...updates } : s
        ),
    })),

    removeStory: (id) => set((state) => ({
        stories: state.stories.filter((s) => s._id !== id),
    })),

    // Submission
    setSubmitting: (submitting) => set({ isSubmitting: submitting }),
}));
