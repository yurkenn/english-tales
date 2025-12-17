import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UnistylesRuntime } from 'react-native-unistyles';
import { Appearance, type ColorSchemeName } from 'react-native';
import { haptics } from '@/utils/haptics';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
    mode: ThemeMode;
    isLoaded: boolean;
}

interface ThemeActions {
    setMode: (mode: ThemeMode) => void;
    toggleTheme: () => void;
    loadTheme: () => Promise<void>;
    setupSystemThemeListener: () => () => void;
}

const THEME_KEY = '@english_tales_theme';

const applyTheme = (mode: ThemeMode, colorScheme?: ColorSchemeName) => {
    let actualTheme: 'light' | 'dark' = 'light';

    if (mode === 'system') {
        const scheme = colorScheme ?? Appearance.getColorScheme();
        actualTheme = scheme === 'dark' ? 'dark' : 'light';
    } else {
        actualTheme = mode;
    }

    try {
        UnistylesRuntime.setTheme(actualTheme);
    } catch (error) {
        console.warn('Failed to set theme:', error);
    }
};

export const useThemeStore = create<ThemeState & { actions: ThemeActions }>()((set, get) => ({
    mode: 'system',
    isLoaded: false,

    actions: {
        setMode: async (mode) => {
            set({ mode });
            applyTheme(mode);
            try {
                await AsyncStorage.setItem(THEME_KEY, mode);
            } catch (e) {
                console.error('Failed to save theme preference');
            }
        },

        toggleTheme: () => {
            haptics.selection();
            const current = get().mode;
            const next: ThemeMode = current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light';
            get().actions.setMode(next);
        },

        loadTheme: async () => {
            try {
                const saved = await AsyncStorage.getItem(THEME_KEY);
                if (saved && ['light', 'dark', 'system'].includes(saved)) {
                    set({ mode: saved as ThemeMode, isLoaded: true });
                    applyTheme(saved as ThemeMode);
                } else {
                    set({ isLoaded: true });
                    applyTheme('system');
                }
            } catch (e) {
                set({ isLoaded: true });
                applyTheme('system');
            }
        },

        setupSystemThemeListener: () => {
            const subscription = Appearance.addChangeListener(({ colorScheme }) => {
                const currentMode = get().mode;
                // Only update if we're in system mode
                if (currentMode === 'system') {
                    applyTheme('system', colorScheme);
                }
            });

            // Return cleanup function
            return () => subscription.remove();
        },
    },
}));

