/**
 * Native Firebase Authentication Service - Modular API
 */

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    signInAnonymously as firebaseSignInAnonymously,
    sendPasswordResetEmail as firebaseSendPasswordResetEmail,
    onAuthStateChanged,
    updateProfile,
    signInWithCredential,
    reauthenticateWithCredential,
    GoogleAuthProvider,
    EmailAuthProvider,
} from '@react-native-firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import { User } from '@/types';
import { generateGuestUsername } from '@/utils/guestUsername';

const auth = getAuth();

// Map Firebase user to App user
const mapUser = (firebaseUser: any): User => {
    return {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || (firebaseUser.isAnonymous ? 'Guest' : null),
        photoURL: firebaseUser.photoURL,
        createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
        isAnonymous: firebaseUser.isAnonymous,
    };
};

/**
 * Subscribe to auth state changes
 */
export const onAuthStateChange = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, (firebaseUser) => {
        const user = firebaseUser ? mapUser(firebaseUser) : null;
        callback(user);
    });
};

/**
 * Sign up with email and password
 */
export const signUp = async (email: string, password: string, displayName: string): Promise<User> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    // Reload user to get updated displayName
    await userCredential.user.reload();
    // Get the current user with updated profile
    const updatedUser = auth.currentUser;
    return mapUser(updatedUser || userCredential.user);
};

/**
 * Sign in with email and password
 */
export const signIn = async (email: string, password: string): Promise<User> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return mapUser(userCredential.user);
};

/**
 * Sign out
 */
export const signOut = async (): Promise<void> => {
    try {
        await GoogleSignin.signOut();
    } catch {
        // Ignore if not signed in with Google
    }
    await firebaseSignOut(auth);
};

/**
 * Sign in anonymously (guest mode)
 * Generates a fun, thematic username automatically
 */
export const signInAnonymously = async (): Promise<User> => {
    const userCredential = await firebaseSignInAnonymously(auth);

    // Generate a fun username for the guest user
    const guestUsername = generateGuestUsername();

    // Update the profile with the generated username
    await updateProfile(userCredential.user, { displayName: guestUsername });

    // Reload to get updated profile
    await userCredential.user.reload();
    const updatedUser = auth.currentUser;

    return mapUser(updatedUser || userCredential.user);
};


/**
 * Update user profile
 */
export const updateUserProfile = async (displayName: string): Promise<User> => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        throw new Error('No user logged in');
    }
    await updateProfile(currentUser, { displayName });
    return mapUser(currentUser);
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email: string): Promise<void> => {
    await firebaseSendPasswordResetEmail(auth, email);
};

// Google Sign-In configuration
let isGoogleSignInConfigured = false;

const configureGoogleSignIn = () => {
    if (isGoogleSignInConfigured) return;

    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    const iosClientId = process.env.EXPO_PUBLIC_IOS_CLIENT_ID;

    if (!webClientId) {
        throw new Error('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not set');
    }

    const config: any = {
        webClientId,
        offlineAccess: true,
    };

    if (Platform.OS === 'ios' && iosClientId) {
        config.iosClientId = iosClientId;
    }

    GoogleSignin.configure(config);
    isGoogleSignInConfigured = true;
};

/**
 * Sign in with Google
 */
export const signInWithGoogle = async (): Promise<User> => {
    try {
        configureGoogleSignIn();

        if (Platform.OS === 'android') {
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        }

        const signInResult = await GoogleSignin.signIn();
        const idToken = signInResult.data?.idToken;

        if (!idToken) {
            throw new Error('No ID token returned from Google Sign-In');
        }

        const googleCredential = GoogleAuthProvider.credential(idToken);
        const userCredential = await signInWithCredential(auth, googleCredential);

        return mapUser(userCredential.user);
    } catch (error: any) {
        if (error.code === 'DEVELOPER_ERROR' || error.message?.includes('DEVELOPER_ERROR')) {
            const msg = Platform.OS === 'android'
                ? 'DEVELOPER_ERROR: Please ensure SHA-1 fingerprint is registered in Firebase Console'
                : 'DEVELOPER_ERROR: Please verify bundle identifier and OAuth client IDs';
            throw new Error(msg);
        }

        if (error.code === statusCodes.SIGN_IN_CANCELLED) {
            throw new Error('Sign in was cancelled');
        } else if (error.code === statusCodes.IN_PROGRESS) {
            throw new Error('Sign in is already in progress');
        } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
            throw new Error('Play services not available');
        }

        throw new Error(error.message || 'Google sign-in failed');
    }
};

/**
 * Get current user
 */
export const getCurrentUser = (): User | null => {
    const currentUser = auth.currentUser;
    return currentUser ? mapUser(currentUser) : null;
};

/**
 * Delete user account
 * This permanently deletes the Firebase Auth user
 * User data in Firestore should be deleted separately via userService
 */
export const deleteAccount = async (): Promise<void> => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        throw new Error('No user logged in');
    }

    const deleteUser = async () => {
        // Sign out of Google if signed in
        try {
            await GoogleSignin.signOut();
        } catch {
            // Ignore if not signed in with Google
        }

        // Delete the Firebase Auth user
        await currentUser.delete();
    };

    try {
        await deleteUser();
    } catch (error: any) {
        // If requires recent authentication, try to reauthenticate
        if (error.code === 'auth/requires-recent-login') {
            // Check if user signed in with Google
            const googleProvider = currentUser.providerData.find(
                (p) => p.providerId === 'google.com'
            );

            if (googleProvider) {
                // Try to reauthenticate with Google
                try {
                    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
                    const signInResult = await GoogleSignin.signIn();
                    const idToken = signInResult?.data?.idToken;

                    if (idToken) {
                        const credential = GoogleAuthProvider.credential(idToken);
                        await reauthenticateWithCredential(currentUser, credential);
                        // Retry deletion after reauthentication
                        await deleteUser();
                        return;
                    }
                } catch (reauthError) {
                    console.error('Failed to reauthenticate with Google:', reauthError);
                }
            }

            // For email users or if Google reauth failed, throw error
            throw new Error('REQUIRES_REAUTHENTICATION');
        }
        throw error;
    }
};
