// Basic Jest setup for Expo
require('@testing-library/jest-native/extend-expect');

// Mock Expo constants
jest.mock('expo-constants', () => ({
    expoConfig: {
        extra: {},
    },
    manifest: {},
}));

// Mock Unistyles
jest.mock('react-native-unistyles', () => {
    return {
        StyleSheet: {
            create: (styles) => (typeof styles === 'function' ? styles({
                colors: { primary: '#007AFF', text: '#000000', backgroundSecondary: '#F2F2F7', error: '#FF3B30', textInverse: '#FFFFFF' },
                spacing: { sm: 8, md: 16, lg: 24, xl: 32, xs: 4 },
                typography: { size: { sm: 14, md: 16, lg: 18, xs: 12 }, weight: { semibold: '600', medium: '500' } },
                radius: { xl: 12 },
                shadows: { md: {} },
            }) : styles),
        },
        useUnistyles: () => ({
            theme: {
                colors: { primary: '#007AFF', text: '#000000', backgroundSecondary: '#F2F2F7', error: '#FF3B30', textInverse: '#FFFFFF' },
                spacing: { sm: 8, md: 16, lg: 24, xl: 32, xs: 4 },
                typography: { size: { sm: 14, md: 16, lg: 18, xs: 12 }, weight: { semibold: '600', medium: '500' } },
                radius: { xl: 12 },
                shadows: { md: {} },
            },
            runtime: {
                themeName: 'light',
            },
        }),
    };
});

// Mock Router
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: jest.fn(),
        back: jest.fn(),
        replace: jest.fn(),
    }),
    useLocalSearchParams: () => ({}),
    useSegments: () => [],
    Stack: () => null,
}));

// Mock Haptics
jest.mock('expo-haptics', () => ({
    impactAsync: jest.fn(),
    notificationAsync: jest.fn(),
    selectionAsync: jest.fn(),
    ImpactFeedbackStyle: {
        Light: 'light',
        Medium: 'medium',
        Heavy: 'heavy',
    },
    NotificationFeedbackType: {
        Success: 'success',
        Warning: 'warning',
        Error: 'error',
    },
}));

// Mock expo-localization
jest.mock('expo-localization', () => ({
    getLocales: () => [{ languageCode: 'en' }],
}));
