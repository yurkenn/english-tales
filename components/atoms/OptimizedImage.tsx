import React from 'react';
import { Image, ImageProps, ImageStyle, StyleProp } from 'react-native';
import { Image as ExpoImage, ImageProps as ExpoImageProps } from 'expo-image';
import { useUnistyles } from 'react-native-unistyles';
import Animated from 'react-native-reanimated';

const AnimatedExpoImage = Animated.createAnimatedComponent(ExpoImage) as any;

export interface OptimizedImageProps extends Omit<ExpoImageProps, 'source'> {
    source: { uri: string } | number;
    placeholder?: string;
    style?: StyleProp<ImageStyle>;
    fallback?: boolean; // Use React Native Image as fallback
    sharedTransitionTag?: string;
    width?: number;
    height?: number;
}

/**
 * Optimized Image component using expo-image with fallback support
 * Provides better performance, caching, and placeholder support
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
    source,
    placeholder,
    style,
    fallback = false,
    sharedTransitionTag,
    width,
    height,
    ...props
}) => {
    const { theme } = useUnistyles();

    // Helper to optimize Sanity URL
    const getOptimizedUri = (uri: string) => {
        if (!uri.includes('cdn.sanity.io')) return uri;

        let optimizedUri = uri;
        const separator = optimizedUri.includes('?') ? '&' : '?';

        if (width) optimizedUri += `${separator}w=${Math.round(width * 2)}`; // 2x for retina
        if (height) optimizedUri += `${optimizedUri.includes('?') ? '&' : '?'}h=${Math.round(height * 2)}`;

        // Add auto format and quality
        optimizedUri += `${optimizedUri.includes('?') ? '&' : '?'}auto=format&q=75`;

        return optimizedUri;
    };

    // Convert source to expo-image format
    const imageSource = typeof source === 'number'
        ? source
        : { uri: getOptimizedUri(source.uri) };

    // Use React Native Image as fallback if needed
    if (fallback) {
        return (
            <Image
                source={source}
                style={style}
                {...(props as ImageProps)}
            />
        );
    }

    return (
        <AnimatedExpoImage
            source={imageSource}
            style={style}
            placeholder={placeholder || theme.colors.borderLight}
            contentFit="cover"
            transition={300} // Slightly longer transition for smoother progressive load
            cachePolicy="memory-disk"
            sharedTransitionTag={sharedTransitionTag}
            {...props}
        />
    );
};
