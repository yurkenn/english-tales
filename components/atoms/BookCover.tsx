import React, { useMemo } from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
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
}) => {
    const { theme } = useUnistyles();
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

    return (
        <View style={[styles.container(width, finalHeight), style]}>
            {/* Page Stack Effect */}
            {showPages && (
                <>
                    <View style={[styles.pageLayer(borderRadius, 1), { right: -3, bottom: -3, zIndex: -1 }]} />
                    <View style={[styles.pageLayer(borderRadius, 2), { right: -6, bottom: -6, zIndex: -2 }]} />
                </>
            )}

            <View style={styles.imageContainer(borderRadius)}>
                {sharedTransitionTag ? (
                    <Animated.Image
                        source={imageSource}
                        style={styles.image}
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
                {!flat && <View style={styles.innerBorder(borderRadius)} />}

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

const styles = StyleSheet.create((theme) => ({
    container: (width: number, height: number) => ({
        width,
        height,
        backgroundColor: theme.colors.surface,
        borderRadius: 10,
        ...theme.shadows.md,
    }),
    pageLayer: (borderRadius: number, level: number) => ({
        position: 'absolute',
        top: level,
        left: level,
        borderRadius,
        backgroundColor: theme.colors.backgroundSecondary,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    }),
    imageContainer: (borderRadius: number) => ({
        flex: 1,
        borderRadius,
        overflow: 'hidden',
        backgroundColor: theme.colors.surface,
    }),
    image: {
        width: '100%',
        height: '100%',
    },
    innerBorder: (borderRadius: number) => ({
        ...StyleSheet.absoluteFillObject,
        borderRadius,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    }),
    glossOverlay: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.5,
    },
}));
