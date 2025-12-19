export type ReadingTheme = 'light' | 'dark' | 'sepia';

export const READING_THEMES: Record<ReadingTheme, { bg: string; text: string; accent: string }> = {
    light: { bg: '#FBFBFB', text: '#1A1A1A', accent: '#EA2A33' },
    dark: { bg: '#0F0F0F', text: '#E0E0E0', accent: '#FF4D4D' },
    sepia: { bg: '#F2ECD9', text: '#433422', accent: '#A67C52' },
};
