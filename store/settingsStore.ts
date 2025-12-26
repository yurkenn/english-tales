import { create } from 'zustand';
import { Settings } from '@/types';
import { Result } from '@/types/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '@/i18n';
import * as Localization from 'expo-localization';

const SETTINGS_KEY = '@english_tales_settings';

// State
interface SettingsState {
    settings: Settings;
    isLoading: boolean;
    error: string | null;
}

// Actions
interface SettingsActions {
    updateSettings: (updates: Partial<Settings>) => Promise<Result<Settings>>;
    resetSettings: () => Promise<void>;
    loadSettings: () => Promise<void>;
}

// Default settings
const getInitialLanguage = (): 'en' | 'tr' | 'es' | 'de' | 'fr' => {
    try {
        const locales = Localization.getLocales();
        const code = locales && locales.length > 0 ? locales[0].languageCode : 'en';
        const supported = ['en', 'tr', 'es', 'de', 'fr'];
        return supported.includes(code as string) ? (code as any) : 'en';
    } catch {
        return 'en';
    }
};

const defaultSettings: Settings = {
    theme: 'system',
    fontSize: 'medium',
    notificationsEnabled: true,
    dailyGoalMinutes: 15,
    language: getInitialLanguage(),
    proficiencyLevel: 'intermediate',
};

// Initial state
const initialState: SettingsState = {
    settings: defaultSettings,
    isLoading: false,
    error: null,
};

export const useSettingsStore = create<SettingsState & { actions: SettingsActions }>()((set, get) => ({
    ...initialState,

    actions: {
        updateSettings: async (updates) => {
            try {
                const newSettings = { ...get().settings, ...updates };
                await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));

                if (updates.language) {
                    await i18n.changeLanguage(updates.language);
                }

                set({ settings: newSettings });
                return { success: true, data: newSettings };
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to update settings';
                set({ error: message });
                return { success: false, error: message };
            }
        },

        resetSettings: async () => {
            await AsyncStorage.removeItem(SETTINGS_KEY);
            set({ settings: defaultSettings });
        },

        loadSettings: async () => {
            set({ isLoading: true, error: null });
            try {
                const stored = await AsyncStorage.getItem(SETTINGS_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored) as Settings;
                    const mergedSettings = { ...defaultSettings, ...parsed };

                    // Apply language to i18n
                    if (mergedSettings.language) {
                        await i18n.changeLanguage(mergedSettings.language);
                    }

                    set({ settings: mergedSettings, isLoading: false });
                } else {
                    set({ isLoading: false });
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to load settings';
                set({ isLoading: false, error: message });
            }
        },
    },
}));
