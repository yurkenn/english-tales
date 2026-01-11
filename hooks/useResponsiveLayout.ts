import { useWindowDimensions } from 'react-native'
import { useTheme } from '@/theme';
import { getBreakpoint, layout, type Breakpoint } from '@/theme/responsive'

/**
 * Centralized Responsive Layout Hook
 * 
 * Tüm responsive layout değerlerini merkezi olarak sağlar.
 * Container padding, gap, section spacing, font scaling gibi değerler için kullanılır.
 * 
 * @example
 * const { containerPadding, sectionSpacing, scaleFont, isTablet } = useResponsiveLayout()
 */
export function useResponsiveLayout() {
    const { theme } = useTheme();
    const { width: windowWidth } = useWindowDimensions()

    // Mevcut breakpoint'i belirle
    const breakpoint: Breakpoint = getBreakpoint(windowWidth)

    // responsive.ts'den layout değerlerini al
    const containerPadding = layout.containerPadding[breakpoint]
    const cardGap = layout.cardGap[breakpoint]
    const sectionSpacing = layout.sectionSpacing[breakpoint]
    const headerHeight = layout.headerHeight[breakpoint]
    const tabBarHeight = layout.tabBarHeight[breakpoint]
    const fontScale = layout.fontScale[breakpoint]
    const contentMaxWidth = layout.contentMaxWidth[breakpoint]

    /**
     * Font boyutunu breakpoint'e göre ölçeklendir
     * @param baseSize - Temel font boyutu (theme.typography.size değerleri)
     * @returns Ölçeklenmiş font boyutu
     */
    const scaleFont = (baseSize: number): number => {
        return Math.round(baseSize * fontScale)
    }

    return {
        /** Container horizontal padding */
        containerPadding,
        /** Grid öğeleri arası boşluk */
        cardGap,
        /** Bölümler arası dikey boşluk */
        sectionSpacing,
        /** Header yüksekliği */
        headerHeight,
        /** Tab bar yüksekliği */
        tabBarHeight,
        /** Font scale multiplier */
        fontScale,
        /** Max content width for tablets */
        contentMaxWidth,
        /** Font boyutunu ölçeklendir */
        scaleFont,
        /** Aktif breakpoint (xs, sm, md, lg, xl) */
        breakpoint,
        /** Mevcut pencere genişliği */
        windowWidth,
        /** Cihaz tipi kontrolü */
        isPhone: breakpoint === 'xs' || breakpoint === 'sm' || breakpoint === 'md',
        isTablet: breakpoint === 'lg' || breakpoint === 'xl',
    }
}

export type ResponsiveLayoutResult = ReturnType<typeof useResponsiveLayout>

