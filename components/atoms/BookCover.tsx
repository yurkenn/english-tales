import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { LinearGradient } from 'expo-linear-gradient';
import { OptimizedImage } from './OptimizedImage';

interface BookCoverProps {
    source: { uri: string } | number;
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
    style,
    sharedTransitionTag,
    placeholder,
    contentFit = 'cover',
    flat = false,
    showPages = false,
}) => {
    const { theme } = useUnistyles();
    const finalHeight = height || (width * 3) / 2;

    return (
        <View style={[styles.container, { width, height: finalHeight }, style]}>
            {showPages && (
                <>
                    {/* Page stack effect - Bottom layer */}
                    <View style={[styles.pageLayer, {
                        bottom: -4,
                        right: -3,
                        width: '100%',
                        height: '100%',
                        borderRadius,
                        backgroundColor: (theme as any).colors.backgroundSecondary || '#F0F0F0',
                        borderWidth: 1,
                        borderColor: 'rgba(0,0,0,0.05)',
                    }]} />
                    {/* Page stack effect - Top layer */}
                    <View style={[styles.pageLayer, {
                        bottom: -2,
                        right: -1.5,
                        width: '100%',
                        height: '100%',
                        borderRadius,
                        backgroundColor: (theme as any).colors.background || '#FFFFFF',
                        borderWidth: 1,
                        borderColor: 'rgba(0,0,0,0.05)',
                    }]} />
                </>
            )}

            <View style={[styles.innerContainer, { borderRadius }]}>
                <OptimizedImage
                    source={source}
                    placeholder={placeholder}
                    contentFit={contentFit}
                    style={StyleSheet.absoluteFill}
                    sharedTransitionTag={sharedTransitionTag}
                    width={width}
                    height={finalHeight}
                />

                {!flat && (
                    <>
                        {/* Spine Shadow Overlay */}
                        <LinearGradient
                            colors={['rgba(0,0,0,0.25)', 'rgba(0,0,0,0.05)', 'transparent']}
                            start={{ x: 0, y: 0.5 }}
                            end={{ x: 0.1, y: 0.5 }}
                            style={StyleSheet.absoluteFill}
                        />

                        {/* Spine Edge Highlight (The 'fold') */}
                        <View style={styles.spineHighlight} />

                        {/* Gloss/Reflect Overlay */}
                        <LinearGradient
                            colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)', 'transparent']}
                            start={{ x: 1, y: 0 }}
                            end={{ x: 0.5, y: 0.5 }}
                            style={StyleSheet.absoluteFill}
                        />
                    </>
                )}

                {/* Subtle Inner Border */}
                <View style={[styles.innerBorder, { borderRadius }]} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create((theme: any) => ({
    container: {
        backgroundColor: 'transparent',
        // Note: Shadows should be on the outer container
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 6,
    },
    pageLayer: {
        position: 'absolute',
        zIndex: -1,
    },
    innerContainer: {
        flex: 1,
        overflow: 'hidden',
        backgroundColor: theme.colors.background || '#FFFFFF',
    },
    spineHighlight: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    innerBorder: {
        ...StyleSheet.absoluteFillObject,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
}));
