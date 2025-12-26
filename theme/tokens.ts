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

    // Illustration Accents
    accentOrange: '#EE9D2B',
    accentBlue: '#4287F5',
} as const;

export const colorsDark = {
    // Primary
    primary: '#FF4D4D',
    primaryDark: '#E63946',
    primaryLight: '#FF6B6B',

    // Backgrounds - Modern neutral dark
    background: '#121212',
    backgroundSecondary: '#1E1E1E',
    surface: '#1E1E1E',
    surfaceElevated: '#2A2A2A',

    // Text - High contrast
    text: '#FAFAFA',
    textSecondary: '#A1A1A1',  // Improved from #B3B3B3 for better contrast
    textMuted: '#808080',      // Improved from #737373 for better contrast
    textInverse: '#FFFFFF',    // FIXED: Was #121212, should be white for overlays

    // UI Elements
    border: '#333333',         // Slightly lighter for better visibility
    borderLight: '#404040',    // Slightly lighter
    divider: '#333333',

    // Chip backgrounds
    chipActive: '#FF4D4D',
    chipInactive: 'rgba(255, 255, 255, 0.1)',  // Slightly more visible

    // Status
    success: '#4ADE80',
    warning: '#FBBF24',
    error: '#F87171',

    // Rating
    star: '#FBBF24',
    starEmpty: '#404040',

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.8)',
    overlayLight: 'rgba(0, 0, 0, 0.6)',

    // Illustration Accents (kept vibrant but accessible)
    accentOrange: '#F59E0B',
    accentBlue: '#3B82F6',
} as const;

export const colorsSepia = {
    // Primary - Rich Cognac/Leather tone
    primary: '#936639',
    primaryDark: '#7F5539',
    primaryLight: '#B6AD90',

    // Backgrounds - Traditional "Ayva Sarısı" / Aged Paper
    background: '#FAF3E0',
    backgroundSecondary: '#F2E9D0',
    surface: '#F2E9D0',
    surfaceElevated: '#E8DFCA',

    // Text - Softer Sepia Ink
    text: '#3D342B',
    textSecondary: '#6B5E51',
    textMuted: '#9B8E7D',
    textInverse: '#FAF3E0',

    // UI Elements
    border: '#E8DFCA',
    borderLight: 'rgba(61, 52, 43, 0.08)',
    divider: 'rgba(61, 52, 43, 0.08)',

    // Chip backgrounds
    chipActive: '#936639',
    chipInactive: 'rgba(147, 102, 57, 0.12)',

    // Status (Muted for Sepia)
    success: '#6A994E',
    warning: '#BC6C25',
    error: '#BC4749',

    // Rating
    star: '#BC6C25',
    starEmpty: '#E8DFCA',

    // Overlay
    overlay: 'rgba(30, 20, 10, 0.5)',
    overlayLight: 'rgba(30, 20, 10, 0.3)',

    // Illustration Accents (Muted for Sepia)
    accentOrange: '#BC6C25',
    accentBlue: '#7F5539',
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
    fontFamily: {
        heading: 'Inter_600SemiBold', // Replaced Outfit with Inter for Apple-like uniformity
        body: 'Inter_400Regular',
        semiBold: 'Inter_600SemiBold',
        medium: 'Inter_500Medium',
        bold: 'Inter_700Bold',
        serif: 'CrimsonPro_400Regular', // Premium serif for stories
        serifBold: 'CrimsonPro_700Bold',
    },
    size: {
        // Consistent scale - use these everywhere
        xs: 11,      // Captions, badges, legends
        sm: 13,      // Secondary text, labels
        md: 15,      // Body text, default
        lg: 17,      // Emphasized body, card titles
        xl: 20,      // Section titles
        xxl: 24,     // Screen subtitles
        xxxl: 28,    // Screen titles (headers)
        display: 34, // Large display text
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
    letterSpacing: {
        heading: -0.5,
        body: 0,
        button: 0.5,
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
