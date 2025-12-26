import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ReadingTheme = 'light' | 'dark' | 'sepia';

interface ReadingPrefs {
    fontSize: number;
    lineHeight: number;
    dyslexicFontEnabled: boolean;
    fontFamily: 'sans-serif' | 'serif';
    theme: ReadingTheme;
}

interface ReadingPrefsState extends ReadingPrefs {
    isLoaded: boolean;
}

interface ReadingPrefsActions {
    setFontSize: (size: number) => Promise<void>;
    setLineHeight: (height: number) => Promise<void>;
    setDyslexicFontEnabled: (enabled: boolean) => Promise<void>;
    setFontFamily: (family: 'sans-serif' | 'serif') => Promise<void>;
    setTheme: (theme: ReadingTheme) => Promise<void>;
    loadPrefs: () => Promise<void>;
}

const READING_PREFS_KEY = '@english_tales_reading_prefs';

const defaultPrefs: ReadingPrefs = {
    fontSize: 18,
    lineHeight: 1.6,
    dyslexicFontEnabled: false,
    fontFamily: 'sans-serif',
    theme: 'light',
};

export const useReadingPrefsStore = create<ReadingPrefsState & { actions: ReadingPrefsActions }>()((set, get) => ({
    ...defaultPrefs,
    isLoaded: false,

    actions: {
        setFontSize: async (size) => {
            set({ fontSize: size });
            await AsyncStorage.setItem(READING_PREFS_KEY, JSON.stringify({
                ...get(),
                fontSize: size,
                isLoaded: undefined,
                actions: undefined
            }));
        },

        setLineHeight: async (height) => {
            set({ lineHeight: height });
            await AsyncStorage.setItem(READING_PREFS_KEY, JSON.stringify({
                ...get(),
                lineHeight: height,
                isLoaded: undefined,
                actions: undefined
            }));
        },

        setDyslexicFontEnabled: async (enabled) => {
            set({ dyslexicFontEnabled: enabled });
            await AsyncStorage.setItem(READING_PREFS_KEY, JSON.stringify({
                ...get(),
                dyslexicFontEnabled: enabled,
                isLoaded: undefined,
                actions: undefined
            }));
        },

        setFontFamily: async (family) => {
            set({ fontFamily: family });
            await AsyncStorage.setItem(READING_PREFS_KEY, JSON.stringify({
                ...get(),
                fontFamily: family,
                isLoaded: undefined,
                actions: undefined
            }));
        },

        setTheme: async (theme) => {
            set({ theme });
            await AsyncStorage.setItem(READING_PREFS_KEY, JSON.stringify({
                ...get(),
                theme: theme,
                isLoaded: undefined,
                actions: undefined
            }));
        },

        loadPrefs: async () => {
            const size = await AsyncStorage.getItem('reading_font_size');
            const height = await AsyncStorage.getItem('reading_line_height');
            const dyslexic = await AsyncStorage.getItem('reading_dyslexic_font');
            const family = await AsyncStorage.getItem('reading_font_family');
            const theme = await AsyncStorage.getItem('reading_theme');

            set({
                fontSize: size ? parseInt(size) : defaultPrefs.fontSize,
                lineHeight: height ? parseFloat(height) : defaultPrefs.lineHeight,
                dyslexicFontEnabled: dyslexic === 'true',
                fontFamily: (family as 'sans-serif' | 'serif') || defaultPrefs.fontFamily,
                theme: (theme as ReadingTheme) || defaultPrefs.theme,
                isLoaded: true,
            });
        },
    },
}));
