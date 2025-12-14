import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    updateProfile,
    onAuthStateChanged,
    signInAnonymously as firebaseSignInAnonymously,
    User as FirebaseUser,
    AuthError
} from 'firebase/auth';
import { auth } from './firebase/config';
import { User } from '@/types';

// Map Firebase user to App user
const mapUser = (firebaseUser: FirebaseUser): User => {
    return {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || (firebaseUser.isAnonymous ? 'Guest' : null),
        photoURL: firebaseUser.photoURL,
        createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
        isAnonymous: firebaseUser.isAnonymous,
    };
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, (firebaseUser) => {
        const user = firebaseUser ? mapUser(firebaseUser) : null;
        callback(user);
    });
};

export const signUp = async (email: string, password: string, displayName: string) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
        return mapUser(userCredential.user);
    } catch (error) {
        throw error as AuthError;
    }
};

export const signIn = async (email: string, password: string) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return mapUser(userCredential.user);
    } catch (error) {
        throw error as AuthError;
    }
};

export const signOut = async () => {
    try {
        await firebaseSignOut(auth);
    } catch (error) {
        throw error as AuthError;
    }
};

export const signInAnonymously = async () => {
    try {
        const userCredential = await firebaseSignInAnonymously(auth);
        return mapUser(userCredential.user);
    } catch (error) {
        throw error as AuthError;
    }
};
