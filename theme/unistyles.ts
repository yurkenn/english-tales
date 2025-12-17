import { StyleSheet } from 'react-native-unistyles';
import {
    colors,
    colorsDark,
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

export type Theme = typeof lightTheme;

type AppThemes = {
    light: typeof lightTheme;
    dark: typeof darkTheme;
};

declare module 'react-native-unistyles' {
    export interface UnistylesThemes extends AppThemes { }
}

// Configure unistyles with manual theme control
StyleSheet.configure({
    themes: {
        light: lightTheme,
        dark: darkTheme,
    },
    settings: {
        initialTheme: 'light',
    },
});
