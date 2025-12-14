import { create } from 'zustand';
import { UnistylesRuntime } from 'react-native-unistyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
}

const THEME_KEY = '@english_tales_theme';

const applyTheme = (mode: ThemeMode) => {
    if (mode === 'system') {
        // Enable adaptive themes to follow system
        UnistylesRuntime.setAdaptiveThemes(true);
    } else {
        // Disable adaptive and set specific theme
        UnistylesRuntime.setAdaptiveThemes(false);
        UnistylesRuntime.setTheme(mode);
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
                }
            } catch (e) {
                set({ isLoaded: true });
            }
        },
    },
}));

