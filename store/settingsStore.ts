import { create } from 'zustand';
import { Settings } from '@/types';
import { Result } from '@/types/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
const defaultSettings: Settings = {
    theme: 'system',
    fontSize: 'medium',
    notificationsEnabled: true,
    dailyGoalMinutes: 15,
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
                    set({ settings: { ...defaultSettings, ...parsed }, isLoading: false });
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
