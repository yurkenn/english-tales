import React, { useMemo } from 'react';
import { View, StyleProp, ViewStyle, StyleSheet, ImageStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { useTheme, Theme } from '@/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { OptimizedImage } from './OptimizedImage';
import { urlFor } from '@/services/sanity';

interface BookCoverProps {
    source: { uri: string | any } | number;
    width: number;
    height?: number;
    borderRadius?: number;
    placeholder?: string;
    style?: StyleProp<ViewStyle>;
    sharedTransitionTag?: string;
    contentFit?: 'cover' | 'contain' | 'fill' | 'scale-down';
    /** If true, 3D effects like spine shadow and gloss will be hidden */
    flat?: boolean;
    /** If true, shows a stack of pages on the right and bottom edges */
    showPages?: boolean;
    priority?: 'low' | 'normal' | 'high';
}

export const BookCover: React.FC<BookCoverProps> = ({
    source,
    width,
    height,
    borderRadius = 10,
    placeholder,
    style,
    sharedTransitionTag,
    contentFit = 'cover',
    flat = false,
    showPages = false,
    priority,
}) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const finalHeight = height || width * (3 / 2);

    const imageSource = useMemo(() => {
        if (typeof source === 'number') return source;
        const uri = source.uri;
        if (!uri) return null;

        if (typeof uri === 'string') return { uri };

        // Handle Sanity image object
        try {
            return { uri: urlFor(uri).width(Math.round(width * 2)).url() };
        } catch (e) {
            console.warn('[BookCover] Failed to generate URL from Sanity object:', e);
            return null;
        }
    }, [source, width]);

    // Dynamic styles computed inline
    const containerStyle: ViewStyle = useMemo(() => ({
        width,
        height: finalHeight,
        backgroundColor: theme.colors.surface,
        borderRadius: 10,
        ...theme.shadows.md,
    }), [width, finalHeight, theme]);

    const pageLayerStyle = (level: number): ViewStyle => ({
        position: 'absolute',
        top: level,
        left: level,
        borderRadius,
        backgroundColor: theme.colors.backgroundSecondary,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        width: width - (level * 2),
        height: finalHeight - (level * 2),
    });

    const imageContainerStyle: ViewStyle = useMemo(() => ({
        flex: 1,
        borderRadius,
        overflow: 'hidden',
        backgroundColor: theme.colors.surface,
    }), [borderRadius, theme]);

    const innerBorderStyle: ViewStyle = useMemo(() => ({
        ...StyleSheet.absoluteFillObject,
        borderRadius,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    }), [borderRadius]);

    return (
        <View style={[containerStyle, style]}>
            {/* Page Stack Effect */}
            {showPages && (
                <>
                    <View style={[pageLayerStyle(1), { right: -3, bottom: -3, zIndex: -1 }]} />
                    <View style={[pageLayerStyle(2), { right: -6, bottom: -6, zIndex: -2 }]} />
                </>
            )}

            <View style={imageContainerStyle}>
                {sharedTransitionTag ? (
                    <Animated.Image
                        source={imageSource}
                        style={styles.image as ImageStyle}
                        {...({ sharedTransitionTag } as any)}
                    />
                ) : (
                    <OptimizedImage
                        source={source}
                        style={styles.image}
                        contentFit={contentFit}
                        placeholder={placeholder}
                        width={width}
                        height={finalHeight}
                        priority={priority}
                    />
                )}

                {/* Spine Shadow Effect */}
                {!flat && (
                    <LinearGradient
                        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.1)', 'transparent']}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 0.15, y: 0.5 }}
                        style={StyleSheet.absoluteFill}
                    />
                )}

                {/* Inner Border Look */}
                {!flat && <View style={innerBorderStyle} />}

                {/* Gloss/Highlight Effect */}
                {!flat && (
                    <LinearGradient
                        colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0)', 'rgba(255,255,255,0.05)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.glossOverlay}
                    />
                )}
            </View>
        </View>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
    image: {
        width: '100%',
        height: '100%',
    },
    glossOverlay: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.5,
    },
});
