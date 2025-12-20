import { Appearance } from 'react-native';
import { StyleSheet, UnistylesRuntime } from 'react-native-unistyles';
import {
    colors,
    colorsDark,
    colorsSepia,
    spacing,
    radius,
    typography,
    shadows,
    iconSize,
    avatarSize,
    bookCover,
    tabBar,
} from './tokens';

// Light theme
export const lightTheme = {
    colors,
    spacing,
    radius,
    typography,
    shadows,
    iconSize,
    avatarSize,
    bookCover,
    tabBar,
} as const;

// Dark theme
export const darkTheme = {
    colors: colorsDark,
    spacing,
    radius,
    typography,
    shadows,
    iconSize,
    avatarSize,
    bookCover,
    tabBar,
} as const;

// Sepia theme
export const sepiaTheme = {
    colors: colorsSepia,
    spacing,
    radius,
    typography,
    shadows,
    iconSize,
    avatarSize,
    bookCover,
    tabBar,
} as const;

export type Theme = typeof lightTheme;

type AppThemes = {
    light: typeof lightTheme;
    dark: typeof darkTheme;
    sepia: typeof sepiaTheme;
};

declare module 'react-native-unistyles' {
    export interface UnistylesThemes extends AppThemes { }
}

// Get initial theme from system appearance
const getInitialTheme = (): 'light' | 'dark' | 'sepia' => {
    return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
};

// Configure unistyles - NO adaptiveThemes, we control switching manually
StyleSheet.configure({
    themes: {
        light: lightTheme,
        dark: darkTheme,
        sepia: sepiaTheme,
    },
    settings: {
        initialTheme: getInitialTheme(),
    },
});

/**
 * Set the app theme - single source of truth for theme switching
 * This is called by the theme store whenever theme changes
 */
export const setAppTheme = (themeName: 'light' | 'dark' | 'sepia'): boolean => {
    try {
        // Check if Unistyles runtime is ready
        if (typeof UnistylesRuntime?.themeName === 'undefined') {
            // Runtime not ready yet, will be set on next call
            return false;
        }
        UnistylesRuntime.setTheme(themeName);
        return true;
    } catch (error) {
        console.warn('[Theme] Failed to set Unistyles theme:', error);
        return false;
    }
};

/**
 * Get current theme name from Unistyles
 */
export const getCurrentThemeName = (): 'light' | 'dark' | 'sepia' => {
    try {
        return UnistylesRuntime.themeName as 'light' | 'dark' | 'sepia';
    } catch {
        return getInitialTheme();
    }
};
