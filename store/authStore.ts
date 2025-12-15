import { create } from 'zustand';
import { User } from '@/types';
import { onAuthStateChange, signOut as authSignOut } from '@/services/auth';
import { router } from 'expo-router';

interface AuthState {
    user: User | null;
    isLoading: boolean;
    initialized: boolean;
    setUser: (user: User | null) => void;
    setIsLoading: (isLoading: boolean) => void;
    signOut: () => Promise<void>;
    signInAnonymously: () => Promise<void>;
    updateProfile: (displayName: string) => Promise<void>;
    initialize: () => () => void; // Returns unsubscribe function
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    isLoading: true,
    initialized: false,
    setUser: (user) => set({ user }),
    setIsLoading: (isLoading) => set({ isLoading }),
    signOut: async () => {
        await authSignOut();
        set({ user: null });
        router.replace('/login');
    },
    signInAnonymously: async () => {
        // We handle the route redirect in the _layout listener
        // Just triggering the service call here
        const { signInAnonymously } = await import('@/services/auth');
        await signInAnonymously();
    },
    updateProfile: async (displayName: string) => {
        const { updateUserProfile } = await import('@/services/auth');
        const updatedUser = await updateUserProfile(displayName);
        set({ user: updatedUser });
    },
    initialize: () => {
        if (get().initialized) return () => { };

        const unsubscribe = onAuthStateChange((user) => {
            set({ user, isLoading: false, initialized: true });
        });

        return unsubscribe;
    },
}));
