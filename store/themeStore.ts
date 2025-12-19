import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, type ColorSchemeName } from 'react-native';
import { setAppTheme } from '@/theme/unistyles';
import { haptics } from '@/utils/haptics';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
    mode: ThemeMode;
    isDark: boolean;
    isLoaded: boolean;
    /** Key that changes on every theme switch to force re-renders */
    themeKey: number;
    highContrastEnabled: boolean;
}

interface ThemeActions {
    setMode: (mode: ThemeMode) => void;
    toggleTheme: () => void;
    loadTheme: () => Promise<void>;
    setupSystemThemeListener: () => () => void;
    setHighContrastEnabled: (enabled: boolean) => void;
}

const THEME_KEY = '@english_tales_theme';
const VALID_MODES: ThemeMode[] = ['light', 'dark', 'system'];

/**
 * Resolve whether we should use dark theme
 */
const resolveIsDark = (mode: ThemeMode, colorScheme?: ColorSchemeName): boolean => {
    if (mode === 'system') {
        return (colorScheme ?? Appearance.getColorScheme()) === 'dark';
    }
    return mode === 'dark';
};

/**
 * Apply theme to Unistyles runtime
 */
const applyTheme = (isDark: boolean): void => {
    setAppTheme(isDark ? 'dark' : 'light');
};

export const useThemeStore = create<ThemeState & { actions: ThemeActions }>()((set, get) => ({
    mode: 'system',
    isDark: Appearance.getColorScheme() === 'dark',
    isLoaded: false,
    themeKey: 0,
    highContrastEnabled: false,

    actions: {
        setMode: async (mode) => {
            const isDark = resolveIsDark(mode);

            // Update state and increment key to force re-renders
            set((state) => ({
                mode,
                isDark,
                themeKey: state.themeKey + 1,
            }));

            applyTheme(isDark);

            // Persist preference
            try {
                await AsyncStorage.setItem(THEME_KEY, mode);
            } catch (e) {
                console.error('Failed to save theme preference');
            }
        },

        toggleTheme: () => {
            haptics.selection();
            const current = get().mode;
            // Cycle: light -> dark -> system -> light
            const next: ThemeMode = current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light';
            get().actions.setMode(next);
        },

        loadTheme: async () => {
            try {
                const saved = await AsyncStorage.getItem(THEME_KEY);
                const mode: ThemeMode = saved && VALID_MODES.includes(saved as ThemeMode)
                    ? (saved as ThemeMode)
                    : 'system';

                const savedHighContrast = await AsyncStorage.getItem('@english_tales_high_contrast');
                const highContrastEnabled = savedHighContrast === 'true';

                const isDark = resolveIsDark(mode);
                set({ mode, isDark, isLoaded: true, highContrastEnabled });
                applyTheme(isDark);
            } catch {
                const isDark = resolveIsDark('system');
                set({ isDark, isLoaded: true, highContrastEnabled: false });
                applyTheme(isDark);
            }
        },

        setupSystemThemeListener: () => {
            const subscription = Appearance.addChangeListener(({ colorScheme }) => {
                const currentMode = get().mode;
                // Only react to system changes if mode is 'system'
                if (currentMode === 'system') {
                    const isDark = colorScheme === 'dark';
                    set((state) => ({
                        isDark,
                        themeKey: state.themeKey + 1,
                    }));
                    applyTheme(isDark);
                }
            });

            return () => subscription.remove();
        },

        setHighContrastEnabled: async (enabled) => {
            set({ highContrastEnabled: enabled });
            try {
                await AsyncStorage.setItem('@english_tales_high_contrast', String(enabled));
            } catch (e) {
                console.error('Failed to save high contrast preference');
            }
        },
    },
}));

// Selector hooks for optimized subscriptions
export const useIsDark = () => useThemeStore((s) => s.isDark);
export const useThemeKey = () => useThemeStore((s) => s.themeKey);
export const useThemeMode = () => useThemeStore((s) => s.mode);
