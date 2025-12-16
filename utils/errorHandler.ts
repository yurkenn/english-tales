import { useToastStore } from '@/store/toastStore';
import { haptics } from './haptics';

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
    return handleError(error, {
        defaultMessage: 'Authentication failed. Please try again.',
    });
};
