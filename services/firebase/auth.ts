import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User,
    UserCredential,
} from 'firebase/auth';
import { auth } from './config';
import { Result } from '@/types/api';

/**
 * Sign in with email and password
 */
export const signIn = async (
    email: string,
    password: string
): Promise<Result<UserCredential>> => {
    try {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        return { success: true, data: credential };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Sign in failed';
        return { success: false, error: message };
    }
};

/**
 * Create a new user with email and password
 */
export const signUp = async (
    email: string,
    password: string
): Promise<Result<UserCredential>> => {
    try {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        return { success: true, data: credential };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Sign up failed';
        return { success: false, error: message };
    }
};

/**
 * Sign out current user
 */
export const signOut = async (): Promise<Result<void>> => {
    try {
        await firebaseSignOut(auth);
        return { success: true, data: undefined };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Sign out failed';
        return { success: false, error: message };
    }
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = (): User | null => {
    return auth.currentUser;
};

/**
 * Subscribe to auth state changes
 */
export const subscribeToAuthChanges = (
    callback: (user: User | null) => void
): (() => void) => {
    return onAuthStateChanged(auth, callback);
};
