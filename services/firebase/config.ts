import { initializeApp, FirebaseApp, getApps, getApp } from 'firebase/app';
import * as firebaseAuth from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? process.env.EXPO_PUBLIC_API_KEY,
    authDomain:
        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? process.env.EXPO_PUBLIC_AUTH_DOMAIN,
    databaseURL:
        process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL ?? process.env.EXPO_PUBLIC_DATABASE_URL,
    projectId:
        process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? process.env.EXPO_PUBLIC_PROJECT_ID,
    storageBucket:
        process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? process.env.EXPO_PUBLIC_STORAGE_BUCKET,
    messagingSenderId:
        process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ??
        process.env.EXPO_PUBLIC_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? process.env.EXPO_PUBLIC_APP_ID,
    measurementId:
        process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID ?? process.env.EXPO_PUBLIC_MEASUREMENT_ID,
};

// Validate required config values
const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig]);

if (missingFields.length > 0) {
    throw new Error(
        `Firebase configuration is missing required fields: ${missingFields.join(', ')}. ` +
        `Please check your environment variables (EXPO_PUBLIC_FIREBASE_* or EXPO_PUBLIC_*).`
    );
}

// Initialize Firebase app (use existing if already initialized)
let app: FirebaseApp;
try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
} catch (error) {
    throw new Error(
        `Failed to initialize Firebase app: ${error instanceof Error ? error.message : String(error)}`
    );
}

// Initialize Auth with persistence for React Native
// For React Native, we MUST use initializeAuth with AsyncStorage persistence on first init
// Strategy: Try initializeAuth first (preferred), fall back to getAuth if already initialized
let auth: firebaseAuth.Auth;
try {
    // Try to initialize with AsyncStorage persistence (required for React Native)
    // This is the recommended approach for React Native apps
    const getReactNativePersistence = (firebaseAuth as any).getReactNativePersistence as
        | ((storage: firebaseAuth.ReactNativeAsyncStorage) => firebaseAuth.Persistence)
        | undefined;

    auth =
        typeof getReactNativePersistence === 'function'
            ? firebaseAuth.initializeAuth(app, {
                persistence: getReactNativePersistence(ReactNativeAsyncStorage),
            })
            : firebaseAuth.getAuth(app);
} catch (initError: any) {
    // If initializeAuth fails because auth is already initialized, use getAuth
    if (
        initError?.code === 'auth/already-initialized' ||
        initError?.message?.includes('already initialized') ||
        initError?.message?.includes('already-initialized') ||
        initError?.message?.includes('already initialized')
    ) {
        try {
            auth = firebaseAuth.getAuth(app);
        } catch (getAuthError) {
            throw new Error(
                `Firebase Auth was already initialized but getAuth failed: ${getAuthError instanceof Error ? getAuthError.message : String(getAuthError)}`
            );
        }
    } else {
        // Other initialization errors - rethrow with context
        throw new Error(
            `Failed to initialize Firebase Auth: ${initError instanceof Error ? initError.message : String(initError)}`
        );
    }
}

export { auth };

// Initialize Firestore
export const db: Firestore = getFirestore(app);

export default app;
