/**
 * Centralized Responsive Design System
 * 
 * Bu dosya tüm responsive tasarım değerlerini merkezi olarak yönetir.
 * Değişiklik yapmak için sadece bu dosyayı düzenleyin.
 */

// Device breakpoints (px)
export const breakpoints = {
    xs: 0,      // Small phones (iPhone SE, 320-374px)
    sm: 375,    // Standard phones (iPhone 13/14, 375-413px)
    md: 414,    // Large phones (iPhone Pro Max, 414-767px)
    lg: 768,    // Tablets (iPad, 768-1023px)
    xl: 1024,   // Large tablets / Desktop (1024px+)
} as const

export type Breakpoint = keyof typeof breakpoints

// Responsive layout tokens - her breakpoint için değerler
export const layout = {
    // Grid sütun sayısı
    gridColumns: {
        xs: 2,
        sm: 2,
        md: 2,
        lg: 3,
        xl: 4,
    },
    // Container padding (horizontal)
    containerPadding: {
        xs: 12,
        sm: 16,
        md: 20,
        lg: 24,
        xl: 32,
    },
    // Grid item arası boşluk
    cardGap: {
        xs: 8,
        sm: 12,
        md: 16,
        lg: 20,
        xl: 24,
    },
    // Tab bar yüksekliği
    tabBarHeight: {
        xs: 56,
        sm: 60,
        md: 64,
        lg: 72,
        xl: 80,
    },
    // Header yüksekliği
    headerHeight: {
        xs: 56,
        sm: 60,
        md: 64,
        lg: 72,
        xl: 80,
    },
    // Section spacing (vertical)
    sectionSpacing: {
        xs: 16,
        sm: 20,
        md: 24,
        lg: 32,
        xl: 40,
    },
    // Font scale multiplier for responsive typography
    fontScale: {
        xs: 0.9,   // Small phones: slightly smaller
        sm: 1.0,   // Standard phones: base size
        md: 1.0,   // Large phones: base size
        lg: 1.1,   // Tablets: slightly larger
        xl: 1.15,  // Large tablets: larger
    },
    // Content max width for tablets (prevents too wide content)
    contentMaxWidth: {
        xs: 9999, // No limit on phones
        sm: 9999,
        md: 9999,
        lg: 600,  // Tablet: limit content width
        xl: 720,  // Large tablet: wider limit
    },
} as const

export type ResponsiveValue<T> = Record<Breakpoint, T>

/**
 * Ekran genişliğine göre aktif breakpoint'i döner
 */
export function getBreakpoint(width: number): Breakpoint {
    if (width >= breakpoints.xl) return 'xl'
    if (width >= breakpoints.lg) return 'lg'
    if (width >= breakpoints.md) return 'md'
    if (width >= breakpoints.sm) return 'sm'
    return 'xs'
}

/**
 * Responsive değer objesinden aktif breakpoint değerini döner
 */
export function getResponsiveValue<T>(
    responsiveValues: ResponsiveValue<T>,
    breakpoint: Breakpoint
): T {
    return responsiveValues[breakpoint]
}
