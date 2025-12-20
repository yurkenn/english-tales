import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ReadingPrefs {
    fontSize: number;
    lineHeight: number;
    dyslexicFontEnabled: boolean;
}

interface ReadingPrefsState extends ReadingPrefs {
    isLoaded: boolean;
}

interface ReadingPrefsActions {
    setFontSize: (size: number) => void;
    setLineHeight: (height: number) => void;
    setDyslexicFontEnabled: (enabled: boolean) => void;
    loadPrefs: () => Promise<void>;
}

const READING_PREFS_KEY = '@english_tales_reading_prefs';

const defaultPrefs: ReadingPrefs = {
    fontSize: 18,
    lineHeight: 1.6,
    dyslexicFontEnabled: false,
};

export const useReadingPrefsStore = create<ReadingPrefsState & { actions: ReadingPrefsActions }>()((set, get) => ({
    ...defaultPrefs,
    isLoaded: false,

    actions: {
        setFontSize: async (size) => {
            set({ fontSize: size });
            const prefs = { fontSize: size, lineHeight: get().lineHeight };
            await AsyncStorage.setItem(READING_PREFS_KEY, JSON.stringify(prefs));
        },

        setLineHeight: async (height) => {
            set({ lineHeight: height });
            const prefs = { fontSize: get().fontSize, lineHeight: height, dyslexicFontEnabled: get().dyslexicFontEnabled };
            await AsyncStorage.setItem(READING_PREFS_KEY, JSON.stringify(prefs));
        },

        setDyslexicFontEnabled: async (enabled) => {
            set({ dyslexicFontEnabled: enabled });
            const prefs = { fontSize: get().fontSize, lineHeight: get().lineHeight, dyslexicFontEnabled: enabled };
            await AsyncStorage.setItem(READING_PREFS_KEY, JSON.stringify(prefs));
        },

        loadPrefs: async () => {
            try {
                const saved = await AsyncStorage.getItem(READING_PREFS_KEY);
                if (saved) {
                    const prefs = JSON.parse(saved) as ReadingPrefs;
                    set({ ...prefs, isLoaded: true });
                } else {
                    set({ isLoaded: true });
                }
            } catch {
                set({ isLoaded: true });
            }
        },
    },
}));
