import { useToastStore } from '@/store/toastStore';
import { haptics } from './haptics';
import { getFirebaseErrorMessage, isNetworkError, isRateLimited } from './firebaseErrorMapper';

export interface ErrorHandlerOptions {
    showToast?: boolean;
    hapticFeedback?: boolean;
    logError?: boolean;
    defaultMessage?: string;
}

/**
 * Standardized error handler for the app
 * Handles errors consistently across the application
 */
export const handleError = (
    error: unknown,
    options: ErrorHandlerOptions = {}
): string => {
    const {
        showToast = true,
        hapticFeedback = true,
        logError = true,
        defaultMessage = 'Something went wrong. Please try again.',
    } = options;

    // Extract error message
    let errorMessage = defaultMessage;
    if (error instanceof Error) {
        errorMessage = error.message || defaultMessage;
    } else if (typeof error === 'string') {
        errorMessage = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message) || defaultMessage;
    }

    // Log error if enabled
    if (logError) {
        console.error('Error:', error);
    }

    // Haptic feedback
    if (hapticFeedback) {
        haptics.error();
    }

    // Show toast if enabled
    if (showToast) {
        const toastActions = useToastStore.getState().actions;
        toastActions.error(errorMessage);
    }

    return errorMessage;
};

/**
 * Handle Firebase errors with user-friendly i18n messages
 */
export const handleFirebaseError = (
    error: unknown,
    options: Omit<ErrorHandlerOptions, 'defaultMessage'> & { fallbackMessage?: string } = {}
): string => {
    const {
        showToast = true,
        hapticFeedback = true,
        logError = true,
        fallbackMessage,
    } = options;

    // Get user-friendly Firebase error message
    const errorMessage = getFirebaseErrorMessage(error, fallbackMessage);

    // Log error if enabled
    if (logError) {
        console.error('Firebase Error:', error);
    }

    // Haptic feedback
    if (hapticFeedback) {
        haptics.error();
    }

    // Show toast if enabled
    if (showToast) {
        const toastActions = useToastStore.getState().actions;

        // Use warning for rate limiting, error for others
        if (isRateLimited(error)) {
            toastActions.error(errorMessage);
        } else if (isNetworkError(error)) {
            toastActions.error(errorMessage);
        } else {
            toastActions.error(errorMessage);
        }
    }

    return errorMessage;
};

/**
 * Handle API/Network errors specifically
 */
export const handleApiError = (error: unknown): string => {
    return handleError(error, {
        defaultMessage: 'Network error. Please check your connection and try again.',
    });
};

/**
 * Handle validation errors
 */
export const handleValidationError = (error: unknown): string => {
    return handleError(error, {
        defaultMessage: 'Please check your input and try again.',
        hapticFeedback: true,
    });
};

/**
 * Handle authentication errors
 */
export const handleAuthError = (error: unknown): string => {
    return handleFirebaseError(error, {
        fallbackMessage: 'Authentication failed. Please try again.',
    });
};

