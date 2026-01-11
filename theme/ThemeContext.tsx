/**
 * Theme Context - React Context based theme system
 * Replaces react-native-unistyles for pure StyleSheet.create() usage
 */
import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useThemeStore, useIsDark, useThemeMode } from '@/store/themeStore';
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
import { layout } from './responsive';

// Theme type definition
export type Theme = {
    colors: typeof colors | typeof colorsDark | typeof colorsSepia;
    spacing: typeof spacing;
    radius: typeof radius;
    typography: typeof typography;
    shadows: typeof shadows;
    iconSize: typeof iconSize;
    avatarSize: typeof avatarSize;
    bookCover: typeof bookCover;
    tabBar: typeof tabBar;
    layout: typeof layout;
};

export type ThemeName = 'light' | 'dark' | 'sepia';

// Pre-built theme objects
export const lightTheme: Theme = {
    colors,
    spacing,
    radius,
    typography,
    shadows,
    iconSize,
    avatarSize,
    bookCover,
    tabBar,
    layout,
};

export const darkTheme: Theme = {
    colors: colorsDark,
    spacing,
    radius,
    typography,
    shadows,
    iconSize,
    avatarSize,
    bookCover,
    tabBar,
    layout,
};

export const sepiaTheme: Theme = {
    colors: colorsSepia,
    spacing,
    radius,
    typography,
    shadows,
    iconSize,
    avatarSize,
    bookCover,
    tabBar,
    layout,
};

// Context
interface ThemeContextValue {
    theme: Theme;
    themeName: ThemeName;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Provider Component
interface ThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const mode = useThemeMode();
    const isDark = useIsDark();

    const value = useMemo<ThemeContextValue>(() => {
        let theme: Theme;
        let themeName: ThemeName;

        if (mode === 'sepia') {
            theme = sepiaTheme;
            themeName = 'sepia';
        } else if (isDark) {
            theme = darkTheme;
            themeName = 'dark';
        } else {
            theme = lightTheme;
            themeName = 'light';
        }

        return { theme, themeName, isDark };
    }, [mode, isDark]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

// Hook
export const useTheme = (): ThemeContextValue => {
    const context = useContext(ThemeContext);
    if (!context) {
        // Fallback for components rendered outside provider
        // This allows gradual migration
        return {
            theme: lightTheme,
            themeName: 'light',
            isDark: false,
        };
    }
    return context;
};

// Helper for creating themed styles
export const createThemedStyles = <T extends Record<string, any>>(
    styleFactory: (theme: Theme) => T
) => {
    return (theme: Theme): T => styleFactory(theme);
};
