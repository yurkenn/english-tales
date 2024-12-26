// src/utils/firebaseErrors.js
export const getFirebaseErrorMessage = (error) => {
  const errorCode = error?.code;

  const errorMessages = {
    // Auth errors
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/user-not-found': 'No account found with this email address.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password should be at least 6 characters long.',
    'auth/too-many-requests': 'Too many unsuccessful attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/invalid-action-code': 'This password reset link is invalid or has expired.',
    'auth/expired-action-code': 'This password reset link has expired.',
    'auth/operation-not-allowed': 'This operation is not allowed. Please contact support.',
    'auth/requires-recent-login': 'Please Login again to complete this action.',

    // Custom general errors
    timeout: 'Request timed out. Please try again.',
    'server-error': 'Server error. Please try again later.',
    unknown: 'An unexpected error occurred. Please try again.',
  };

  return errorMessages[errorCode] || 'An error occurred. Please try again.';
};

export const isTemporaryError = (error) => {
  const temporaryErrors = [
    'auth/too-many-requests',
    'auth/network-request-failed',
    'timeout',
    'server-error',
  ];

  return temporaryErrors.includes(error?.code);
};

export const shouldShowErrorModal = (error) => {
  const modalErrors = [
    'auth/too-many-requests',
    'auth/requires-recent-login',
    'auth/user-disabled',
  ];

  return modalErrors.includes(error?.code);
};
