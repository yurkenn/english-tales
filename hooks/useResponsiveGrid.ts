import { useWindowDimensions } from 'react-native'
import { useUnistyles } from 'react-native-unistyles'
import { getBreakpoint, type Breakpoint } from '@/theme/responsive'

/**
 * Centralized Responsive Grid Hook
 * 
 * Tüm responsive grid hesaplamalarını merkezi olarak yönetir.
 * Tema sisteminden layout değerlerini kullanır.
 * 
 * @example
 * const { cardWidth, columns, gap, padding, breakpoint } = useResponsiveGrid()
 */
export function useResponsiveGrid() {
    const { theme } = useUnistyles()
    const { width: windowWidth } = useWindowDimensions()

    // Mevcut breakpoint'i belirle
    const breakpoint: Breakpoint = getBreakpoint(windowWidth)

    // Tema'dan responsive layout değerlerini al
    const columns = theme.layout.gridColumns[breakpoint]
    const padding = theme.layout.containerPadding[breakpoint]
    const gap = theme.layout.cardGap[breakpoint]
    const tabBarHeight = theme.layout.tabBarHeight[breakpoint]

    // Kart genişliğini hesapla
    const totalGaps = gap * (columns - 1)
    const availableWidth = windowWidth - (padding * 2) - totalGaps
    const cardWidth = availableWidth / columns

    return {
        /** Hesaplanmış kart genişliği */
        cardWidth,
        /** Grid sütun sayısı */
        columns,
        /** Grid öğeleri arası boşluk */
        gap,
        /** Container horizontal padding */
        padding,
        /** Tab bar yüksekliği */
        tabBarHeight,
        /** Aktif breakpoint (xs, sm, md, lg, xl) */
        breakpoint,
        /** Mevcut pencere genişliği */
        windowWidth,
        /** Cihaz tipi kontrolü */
        isPhone: breakpoint === 'xs' || breakpoint === 'sm' || breakpoint === 'md',
        isTablet: breakpoint === 'lg' || breakpoint === 'xl',
    }
}

export type ResponsiveGridResult = ReturnType<typeof useResponsiveGrid>
