import React from 'react';
import { Image, ImageProps, ImageStyle, StyleProp } from 'react-native';
import { Image as ExpoImage, ImageProps as ExpoImageProps } from 'expo-image';
import { useUnistyles } from 'react-native-unistyles';
import Animated from 'react-native-reanimated';
import { getOptimizedUri } from '@/utils/imageUtils';

const AnimatedExpoImage = Animated.createAnimatedComponent(ExpoImage) as any;

export interface OptimizedImageProps extends Omit<ExpoImageProps, 'source'> {
    source: { uri: string | any } | number;
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


    // Convert source to expo-image format
    const optimizedUri = typeof source !== 'number' ? getOptimizedUri(source.uri, { width, height }) : '';
    const imageSource = typeof source === 'number'
        ? source
        : (optimizedUri ? { uri: optimizedUri } : null);

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
