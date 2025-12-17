export type ReadingTheme = 'light' | 'dark' | 'sepia';

export const READING_THEMES: Record<ReadingTheme, { bg: string; text: string }> = {
    light: { bg: '#FFFFFF', text: '#1B0E0E' },
    dark: { bg: '#121212', text: '#FAFAFA' },
    sepia: { bg: '#F4ECD8', text: '#5C4B37' },
};
