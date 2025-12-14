// Design Tokens extracted from HTML design files
// Primary: #ea2a33, Background: #f8f6f6 (light), #211111 (dark)
// Font: Spline Sans

export const colors = {
    // Primary
    primary: '#EA2A33',
    primaryDark: '#C62828',
    primaryLight: '#FF6659',

    // Backgrounds (from design HTML)
    background: '#F8F6F6',
    backgroundSecondary: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',

    // Text
    text: '#1B0E0E',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    textInverse: '#FFFFFF',

    // UI Elements
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    divider: '#E5E7EB',

    // Chip backgrounds
    chipActive: '#EA2A33',
    chipInactive: 'rgba(234, 42, 51, 0.1)',

    // Status
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',

    // Rating
    star: '#FBBF24',
    starEmpty: '#E5E7EB',

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',
} as const;

export const colorsDark = {
    // Primary
    primary: '#EA2A33',
    primaryDark: '#C62828',
    primaryLight: '#FF6659',

    // Backgrounds (from design HTML)
    background: '#211111',
    backgroundSecondary: '#2A1A1A',
    surface: '#2A1A1A',
    surfaceElevated: '#332222',

    // Text
    text: '#FCF8F8',
    textSecondary: '#A1A1AA',
    textMuted: '#71717A',
    textInverse: '#1B0E0E',

    // UI Elements
    border: '#374151',
    borderLight: '#4B5563',
    divider: '#374151',

    // Chip backgrounds
    chipActive: '#EA2A33',
    chipInactive: 'rgba(255, 255, 255, 0.05)',

    // Status
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',

    // Rating
    star: '#FBBF24',
    starEmpty: '#4B5563',

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.7)',
    overlayLight: 'rgba(0, 0, 0, 0.5)',
} as const;

export const spacing = {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    xxxxl: 48,
} as const;

export const radius = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 9999,
} as const;

export const typography = {
    size: {
        xs: 10,
        sm: 12,
        md: 14,
        lg: 16,
        xl: 18,
        xxl: 20,
        xxxl: 24,
        display: 32,
    },
    weight: {
        regular: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '700' as const,
    },
    lineHeight: {
        tight: 1.2,
        normal: 1.4,
        relaxed: 1.6,
    },
} as const;

export const shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 4,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 8,
    },
} as const;

export const iconSize = {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
} as const;

export const avatarSize = {
    sm: 32,
    md: 40,
    lg: 56,
    xl: 80,
} as const;

// Book cover dimensions
export const bookCover = {
    width: 120,
    aspectRatio: 2 / 3, // width / height (portrait)
} as const;

// Tab bar
export const tabBar = {
    height: 64,
    iconSize: 26,
    labelSize: 10,
} as const;
