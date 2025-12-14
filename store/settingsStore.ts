import { create } from 'zustand';
import { Settings } from '@/types';
import { Result } from '@/types/api';

// State
interface SettingsState {
    settings: Settings;
    isLoading: boolean;
    error: string | null;
}

// Actions
interface SettingsActions {
    updateSettings: (updates: Partial<Settings>) => Promise<Result<Settings>>;
    resetSettings: () => void;
    fetchSettings: () => Promise<Result<Settings>>;
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
                // TODO: Add persistence (AsyncStorage or Firebase)
                const newSettings = { ...get().settings, ...updates };
                set({ settings: newSettings });
                return { success: true, data: newSettings };
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to update settings';
                set({ error: message });
                return { success: false, error: message };
            }
        },

        resetSettings: () => set({ settings: defaultSettings }),

        fetchSettings: async () => {
            set({ isLoading: true, error: null });
            try {
                // TODO: Add persistence (AsyncStorage or Firebase)
                set({ isLoading: false });
                return { success: true, data: get().settings };
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to fetch settings';
                set({ isLoading: false, error: message });
                return { success: false, error: message };
            }
        },
    },
}));
