import React from 'react';
// Force reload: 3

import { View, StyleSheet as RNStyleSheet, TouchableOpacity } from 'react-native';
import { } from 'react-native-gesture-handler';
import { useTheme, Theme } from '@/theme';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { OptimizedImage } from '../atoms';

interface StoryHeroProps {
    coverImage: string;
    coverImageLqip?: string;
}

export const StoryHero: React.FC<StoryHeroProps & { storyId: string }> = ({
    storyId,
    coverImage,
    coverImageLqip,
}) => {
    const { theme, isDark } = useTheme();
    const styles = createStyles(theme);

    return (
        <View style={styles.container}>
            {/* Immersive Blurred Backdrop */}
            <View style={RNStyleSheet.absoluteFill} pointerEvents="none">
                <OptimizedImage
                    source={{ uri: coverImage || '' }}
                    placeholder={coverImageLqip}
                    style={RNStyleSheet.absoluteFill}
                    contentFit="cover"
                />
                <BlurView intensity={60} style={RNStyleSheet.absoluteFill} tint={isDark ? 'dark' : 'light'} />
                <LinearGradient
                    colors={['rgba(0,0,0,0.3)', 'transparent', theme.colors.background]}
                    style={styles.gradient}
                />
            </View>

            {/* Main Book Cover */}
            <View style={styles.coverWrapper}>
                <OptimizedImage
                    source={{ uri: coverImage || '' }}
                    placeholder={coverImageLqip}
                    style={styles.bookImage}
                    contentFit="cover"
                    sharedTransitionTag={`story-image-${storyId}`}
                />
                {/* Subtle Spine Decoration Overlay */}
                <View style={styles.spineShadow} />
                <LinearGradient
                    colors={['rgba(0,0,0,0.2)', 'transparent']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 0.05, y: 0.5 }}
                    style={styles.bookImage}
                />
            </View>
        </View>
    );
};

const createStyles = (theme: Theme) => RNStyleSheet.create({
    container: {
        height: 480, // Taller immersive hero
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    gradient: {
        ...RNStyleSheet.absoluteFillObject,
    },
    coverWrapper: {
        width: 180,
        height: 270,
        borderRadius: theme.radius.sm,
        overflow: 'hidden',
        backgroundColor: theme.colors.surface,
        ...theme.shadows.lg,
        shadowColor: '#000',
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 10,
    },
    bookImage: {
        ...RNStyleSheet.absoluteFillObject,
    },
    spineShadow: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        backgroundColor: 'rgba(0,0,0,0.3)',
        zIndex: 1,
    },
});
