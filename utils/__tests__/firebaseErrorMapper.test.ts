import { getFirebaseErrorMessage, isNetworkError, requiresReauth, isRateLimited } from '../firebaseErrorMapper';
import i18n from '@/i18n';

// Mock i18n
jest.mock('@/i18n', () => ({
  t: jest.fn(),
}));

describe('firebaseErrorMapper', () => {
  beforeEach(() => {
    (i18n.t as jest.Mock).mockClear();
    // Default mock implementation: return "Translated " + key
    (i18n.t as jest.Mock).mockImplementation((key) => `Translated ${key}`);
  });

  describe('getFirebaseErrorMessage', () => {
    it('returns correct translation key for mapped auth errors', () => {
      const error = { code: 'auth/user-not-found' };
      const expectedKey = 'errors.firebase.userNotFound';
      const translatedValue = `Translated ${expectedKey}`;

      expect(getFirebaseErrorMessage(error)).toBe(translatedValue);
      expect(i18n.t).toHaveBeenCalledWith(expectedKey);
    });

    it('returns correct translation key for mapped firestore errors', () => {
      const error = { code: 'permission-denied' };
      const expectedKey = 'errors.firebase.permissionDenied';
      const translatedValue = `Translated ${expectedKey}`;

      expect(getFirebaseErrorMessage(error)).toBe(translatedValue);
      expect(i18n.t).toHaveBeenCalledWith(expectedKey);
    });

    it('returns correct translation key for mapped storage errors', () => {
      const error = { code: 'storage/object-not-found' };
      const expectedKey = 'errors.firebase.objectNotFound';
      const translatedValue = `Translated ${expectedKey}`;

      expect(getFirebaseErrorMessage(error)).toBe(translatedValue);
      expect(i18n.t).toHaveBeenCalledWith(expectedKey);
    });

    it('extracts error code from message if code property is missing', () => {
      const error = { message: 'Some error [auth/wrong-password] happened' };
      const expectedKey = 'errors.firebase.wrongPassword';
      const translatedValue = `Translated ${expectedKey}`;

      expect(getFirebaseErrorMessage(error)).toBe(translatedValue);
    });

    it('returns fallback message if provided and error not mapped', () => {
      const error = { code: 'unknown/error' };
      // When key is not mapped, code won't find it in maps, so it goes to fallback
      expect(getFirebaseErrorMessage(error, 'Custom Fallback')).toBe('Custom Fallback');
    });

    it('returns unknown error key if no fallback and error not mapped', () => {
      const error = { code: 'unknown/error' };
      const unknownKey = 'errors.firebase.unknown';
      const translatedUnknown = `Translated ${unknownKey}`;

      expect(getFirebaseErrorMessage(error)).toBe(translatedUnknown);
    });

    it('returns original message if it is short and simple', () => {
        const error = { message: 'Simple error message' };
        expect(getFirebaseErrorMessage(error)).toBe('Simple error message');
    });

    it('returns translated message if key exists in map', () => {
        const error = { code: 'auth/user-not-found' };
        // If translation exists (mock returns different string than key)
        (i18n.t as jest.Mock).mockReturnValue('User not found');
        expect(getFirebaseErrorMessage(error)).toBe('User not found');
    });

    it('skips translation if key returns itself (missing translation)', () => {
         const error = { code: 'auth/user-not-found' };
         // If translation missing (mock returns key)
         (i18n.t as jest.Mock).mockImplementation(key => key);

         // It should fall through to message or default
         // Here message is undefined, so it returns default unknown
         expect(getFirebaseErrorMessage(error)).toBe('errors.firebase.unknown');
    });
  });

  describe('isNetworkError', () => {
    it('identifies network errors correctly', () => {
      expect(isNetworkError({ code: 'auth/network-request-failed' })).toBe(true);
      expect(isNetworkError({ code: 'unavailable' })).toBe(true);
      expect(isNetworkError({ code: 'deadline-exceeded' })).toBe(true);
    });

    it('returns false for non-network errors', () => {
      expect(isNetworkError({ code: 'auth/user-not-found' })).toBe(false);
    });
  });

  describe('requiresReauth', () => {
    it('identifies reauth errors correctly', () => {
      expect(requiresReauth({ code: 'auth/requires-recent-login' })).toBe(true);
      expect(requiresReauth({ code: 'auth/session-expired' })).toBe(true);
    });

    it('returns false for other errors', () => {
        expect(requiresReauth({ code: 'auth/wrong-password' })).toBe(false);
    });
  });

  describe('isRateLimited', () => {
    it('identifies rate limit errors correctly', () => {
      expect(isRateLimited({ code: 'auth/too-many-requests' })).toBe(true);
      expect(isRateLimited({ code: 'resource-exhausted' })).toBe(true);
    });

    it('returns false for other errors', () => {
        expect(isRateLimited({ code: 'auth/user-not-found' })).toBe(false);
    });
  });
});
