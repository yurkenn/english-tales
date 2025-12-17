import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    updateProfile,
    onAuthStateChanged,
    signInAnonymously as firebaseSignInAnonymously,
    sendPasswordResetEmail as firebaseSendPasswordResetEmail,
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

export const updateUserProfile = async (displayName: string): Promise<User> => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        throw new Error('No user logged in');
    }
    try {
        await updateProfile(currentUser, { displayName });
        return mapUser(currentUser);
    } catch (error) {
        throw error as AuthError;
    }
};

export const sendPasswordResetEmail = async (email: string): Promise<void> => {
    try {
        await firebaseSendPasswordResetEmail(auth, email);
    } catch (error) {
        throw error as AuthError;
    }
};

// Google Sign-In
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { Platform } from 'react-native';

let isGoogleSignInConfigured = false;

// Configure Google Sign-In (lazy initialization)
const configureGoogleSignIn = () => {
    if (isGoogleSignInConfigured) return;

    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    const iosClientId = process.env.EXPO_PUBLIC_IOS_CLIENT_ID;
    
    if (!webClientId) {
        throw new Error('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not set in environment variables');
    }

    const config: any = {
        webClientId, // Web client ID from Firebase Console (required for both iOS and Android)
        offlineAccess: true, // Enables server-side access and refresh tokens
    };

    // Add iOS client ID if available
    if (Platform.OS === 'ios' && iosClientId) {
        config.iosClientId = iosClientId;
    }

    GoogleSignin.configure(config);
    isGoogleSignInConfigured = true;
};

export const signInWithGoogle = async (): Promise<User> => {
    try {
        // Configure Google Sign-In if not already configured
        configureGoogleSignIn();

        // Check for Play Services on Android only
        if (Platform.OS === 'android') {
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        }

        // Sign in with Google
        const signInResult = await GoogleSignin.signIn();

        // Get the ID token - API returns data.idToken
        const idToken = signInResult.data?.idToken;
        
        if (!idToken) {
            console.error('Google Sign-In result:', JSON.stringify(signInResult, null, 2));
            throw new Error('No ID token returned from Google Sign-In');
        }

        // Create Firebase credential
        const googleCredential = GoogleAuthProvider.credential(idToken);

        // Sign in to Firebase with the Google credential
        const userCredential = await signInWithCredential(auth, googleCredential);

        return mapUser(userCredential.user);
    } catch (error: any) {
        // Handle DEVELOPER_ERROR with helpful message
        if (error.code === 'DEVELOPER_ERROR' || error.message?.includes('DEVELOPER_ERROR')) {
            const developerErrorMsg = Platform.OS === 'android' 
                ? 'DEVELOPER_ERROR: Please ensure SHA-1 fingerprint is registered in Firebase Console. Run: cd android && ./gradlew signingReport'
                : 'DEVELOPER_ERROR: Please verify bundle identifier and OAuth client IDs in Firebase Console';
            throw new Error(developerErrorMsg);
        }
        
        // Handle specific error codes
        if (error.code === statusCodes.SIGN_IN_CANCELLED) {
            throw new Error('Sign in was cancelled');
        } else if (error.code === statusCodes.IN_PROGRESS) {
            throw new Error('Sign in is already in progress');
        } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
            throw new Error('Play services not available');
        } else if (error.code === statusCodes.SIGN_IN_REQUIRED) {
            throw new Error('Sign in required');
        }
        
        // Handle Firebase auth errors
        if (error.code?.startsWith('auth/')) {
            throw new Error(error.message || 'Authentication failed');
        }
        
        // Re-throw with message if available
        throw new Error(error.message || 'Google sign-in failed');
    }
};
