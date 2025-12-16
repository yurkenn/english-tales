import React from 'react';
import { Image, ImageProps, ImageStyle, StyleProp } from 'react-native';
import { Image as ExpoImage, ImageProps as ExpoImageProps } from 'expo-image';
import { useUnistyles } from 'react-native-unistyles';

export interface OptimizedImageProps extends Omit<ExpoImageProps, 'source'> {
    source: { uri: string } | number;
    placeholder?: string;
    style?: StyleProp<ImageStyle>;
    fallback?: boolean; // Use React Native Image as fallback
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
    ...props
}) => {
    const { theme } = useUnistyles();

    // Convert source to expo-image format
    const imageSource = typeof source === 'number' 
        ? source 
        : { uri: source.uri };

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
        <ExpoImage
            source={imageSource}
            style={style}
            placeholder={placeholder || theme.colors.borderLight}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
            {...props}
        />
    );
};
