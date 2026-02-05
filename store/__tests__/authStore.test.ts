import { act } from '@testing-library/react-native';
import { useAuthStore } from '../authStore';
import { analyticsService } from '@/services/firebase/analytics';
import { crashlyticsService } from '@/services/firebase/crashlytics';

// Mock services
jest.mock('@/services/auth', () => ({
    onAuthStateChange: jest.fn(),
    signOut: jest.fn(),
    signInAnonymously: jest.fn(),
    updateUserProfile: jest.fn(),
}));

jest.mock('expo-router', () => ({
    router: {
        replace: jest.fn(),
    },
}));

jest.mock('@/services/userService', () => ({
    userService: {
        syncProfile: jest.fn(),
    },
}));

jest.mock('@/services/firebase/analytics', () => ({
    analyticsService: {
        setUserId: jest.fn(),
    },
}));

jest.mock('@/services/firebase/crashlytics', () => ({
    crashlyticsService: {
        setUserId: jest.fn(),
    },
}));

// Mock other stores
jest.mock('../libraryStore', () => ({
    useLibraryStore: {
        getState: () => ({
            actions: {
                clearLibrary: jest.fn(),
            },
        }),
    },
}));

jest.mock('../progressStore', () => ({
    useProgressStore: {
        getState: () => ({
            actions: {
                clearProgress: jest.fn(),
            },
        }),
    },
}));

jest.mock('../vocabularyStore', () => ({
    useVocabularyStore: {
        getState: () => ({
            actions: {
                clearAll: jest.fn(),
            },
        }),
    },
}));

describe('authStore', () => {
    beforeEach(() => {
        useAuthStore.setState({
            user: null,
            isLoading: true,
            initialized: false,
        });
        jest.clearAllMocks();
    });

    it('sets user correctly and updates analytics/crashlytics', () => {
        const user = { id: '123', email: 'test@example.com' } as any;

        act(() => {
            useAuthStore.getState().setUser(user);
        });

        expect(useAuthStore.getState().user).toEqual(user);
        expect(analyticsService.setUserId).toHaveBeenCalledWith('123');
        expect(crashlyticsService.setUserId).toHaveBeenCalledWith('123');
    });

    it('clears user correctly and updates analytics', () => {
        const user = { id: '123', email: 'test@example.com' } as any;
        useAuthStore.setState({ user });

        act(() => {
            useAuthStore.getState().setUser(null);
        });

        expect(useAuthStore.getState().user).toBeNull();
        expect(analyticsService.setUserId).toHaveBeenCalledWith(null);
    });

    it('sets loading state correctly', () => {
        act(() => {
            useAuthStore.getState().setIsLoading(false);
        });
        expect(useAuthStore.getState().isLoading).toBe(false);
    });

    // We can add more tests for signOut, updateProfile, etc.
    // However, they involve async dynamic imports which might be tricky to mock perfectly in this setup.
    // The previous mocks for other stores attempt to handle the dynamic imports, but might need adjustment.

    it('initializes correctly', () => {
        const { onAuthStateChange } = require('@/services/auth');
        const unsubscribe = jest.fn();
        onAuthStateChange.mockReturnValue(unsubscribe);

        act(() => {
            useAuthStore.getState().initialize();
        });

        expect(onAuthStateChange).toHaveBeenCalled();
        // Since initialize sets state inside the callback, we can't easily test the state update
        // unless we mock the implementation of onAuthStateChange to call the callback immediately.
    });
});
