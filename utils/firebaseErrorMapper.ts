/**
 * Firebase Error Mapper
 * Maps Firebase error codes to user-friendly i18n keys
 */

import i18n from '@/i18n';

// Firebase Auth Error Codes
const AUTH_ERROR_MAP: Record<string, string> = {
    // Email/Password errors
    'auth/email-already-in-use': 'errors.firebase.emailAlreadyInUse',
    'auth/invalid-email': 'errors.firebase.invalidEmail',
    'auth/user-disabled': 'errors.firebase.userDisabled',
    'auth/user-not-found': 'errors.firebase.userNotFound',
    'auth/wrong-password': 'errors.firebase.wrongPassword',
    'auth/weak-password': 'errors.firebase.weakPassword',
    'auth/invalid-credential': 'errors.firebase.invalidCredential',
    'auth/invalid-verification-code': 'errors.firebase.invalidVerificationCode',
    'auth/invalid-verification-id': 'errors.firebase.invalidVerificationId',

    // Account linking
    'auth/credential-already-in-use': 'errors.firebase.credentialAlreadyInUse',
    'auth/account-exists-with-different-credential': 'errors.firebase.accountExistsWithDifferentCredential',

    // Rate limiting
    'auth/too-many-requests': 'errors.firebase.tooManyRequests',

    // Network
    'auth/network-request-failed': 'errors.firebase.networkError',

    // Session
    'auth/requires-recent-login': 'errors.firebase.requiresRecentLogin',
    'auth/session-expired': 'errors.firebase.sessionExpired',

    // Provider errors
    'auth/popup-closed-by-user': 'errors.firebase.popupClosedByUser',
    'auth/cancelled-popup-request': 'errors.firebase.cancelledPopupRequest',
    'auth/operation-not-allowed': 'errors.firebase.operationNotAllowed',
};

// Firestore Error Codes
const FIRESTORE_ERROR_MAP: Record<string, string> = {
    'permission-denied': 'errors.firebase.permissionDenied',
    'not-found': 'errors.firebase.documentNotFound',
    'already-exists': 'errors.firebase.documentAlreadyExists',
    'resource-exhausted': 'errors.firebase.resourceExhausted',
    'failed-precondition': 'errors.firebase.failedPrecondition',
    'aborted': 'errors.firebase.operationAborted',
    'unavailable': 'errors.firebase.serviceUnavailable',
    'deadline-exceeded': 'errors.firebase.deadlineExceeded',
    'cancelled': 'errors.firebase.operationCancelled',
    'data-loss': 'errors.firebase.dataLoss',
    'unauthenticated': 'errors.firebase.unauthenticated',
    'invalid-argument': 'errors.firebase.invalidArgument',
};

// Storage Error Codes
const STORAGE_ERROR_MAP: Record<string, string> = {
    'storage/object-not-found': 'errors.firebase.objectNotFound',
    'storage/bucket-not-found': 'errors.firebase.bucketNotFound',
    'storage/quota-exceeded': 'errors.firebase.quotaExceeded',
    'storage/unauthenticated': 'errors.firebase.unauthenticated',
    'storage/unauthorized': 'errors.firebase.unauthorized',
    'storage/retry-limit-exceeded': 'errors.firebase.retryLimitExceeded',
    'storage/canceled': 'errors.firebase.uploadCanceled',
};

export interface FirebaseError {
    code?: string;
    message?: string;
}

/**
 * Extract Firebase error code from various error formats
 */
const extractErrorCode = (error: unknown): string | null => {
    if (!error) return null;

    // Direct code access
    if (typeof error === 'object' && 'code' in error) {
        return (error as FirebaseError).code || null;
    }

    // Check message for error code pattern
    if (typeof error === 'object' && 'message' in error) {
        const message = (error as FirebaseError).message || '';
        // Match patterns like [auth/user-not-found] or (auth/user-not-found)
        const match = message.match(/\[([^\]]+)\]|\(([^)]+)\)/);
        if (match) {
            return match[1] || match[2];
        }
    }

    return null;
};

/**
 * Get user-friendly error message for Firebase errors
 * Automatically uses the current i18n language
 */
export const getFirebaseErrorMessage = (error: unknown, fallback?: string): string => {
    const code = extractErrorCode(error);

    if (code) {
        // Check Auth errors
        if (AUTH_ERROR_MAP[code]) {
            const translated = i18n.t(AUTH_ERROR_MAP[code]);
            if (translated !== AUTH_ERROR_MAP[code]) {
                return translated;
            }
        }

        // Check Firestore errors
        if (FIRESTORE_ERROR_MAP[code]) {
            const translated = i18n.t(FIRESTORE_ERROR_MAP[code]);
            if (translated !== FIRESTORE_ERROR_MAP[code]) {
                return translated;
            }
        }

        // Check Storage errors
        if (STORAGE_ERROR_MAP[code]) {
            const translated = i18n.t(STORAGE_ERROR_MAP[code]);
            if (translated !== STORAGE_ERROR_MAP[code]) {
                return translated;
            }
        }
    }

    // Fallback to error message or default
    if (typeof error === 'object' && error !== null && 'message' in error) {
        const message = (error as FirebaseError).message;
        if (message && !message.includes('[') && message.length < 100) {
            return message;
        }
    }

    return fallback || i18n.t('errors.firebase.unknown');
};

/**
 * Check if error is a network-related error
 */
export const isNetworkError = (error: unknown): boolean => {
    const code = extractErrorCode(error);
    return code === 'auth/network-request-failed' ||
        code === 'unavailable' ||
        code === 'deadline-exceeded';
};

/**
 * Check if error requires re-authentication
 */
export const requiresReauth = (error: unknown): boolean => {
    const code = extractErrorCode(error);
    return code === 'auth/requires-recent-login' || code === 'auth/session-expired';
};

/**
 * Check if error is due to rate limiting
 */
export const isRateLimited = (error: unknown): boolean => {
    const code = extractErrorCode(error);
    return code === 'auth/too-many-requests' || code === 'resource-exhausted';
};

export default {
    getFirebaseErrorMessage,
    isNetworkError,
    requiresReauth,
    isRateLimited,
};
