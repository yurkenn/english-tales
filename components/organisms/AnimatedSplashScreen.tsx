import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    runOnJS,
    Easing,
} from 'react-native-reanimated';
import { Image } from 'expo-image';

const { width } = Dimensions.get('window');
const ICON_SIZE = width * 0.4; // Responsive icon size matching native splash roughly

interface AnimatedSplashScreenProps {
    onAnimationComplete: () => void;
}

/**
 * AnimatedSplashScreen component using Reanimated.
 * Provides a seamless transition from the native static splash.
 */
export const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({
    onAnimationComplete,
}) => {
    // Start at 1 to match the native splash exactly
    const logoOpacity = useSharedValue(1);
    const logoScale = useSharedValue(1);
    const containerOpacity = useSharedValue(1);

    const animatedLogoStyle = useAnimatedStyle(() => ({
        opacity: logoOpacity.value,
        transform: [{ scale: logoScale.value }],
    }));

    const animatedContainerStyle = useAnimatedStyle(() => ({
        opacity: containerOpacity.value,
    }));

    useEffect(() => {
        // Subtle wait for the eye to track, then perform zoom-out/fade-out
        const timer = setTimeout(() => {
            // "Netflix-like" zoom in and fade out
            logoScale.value = withTiming(1.2, {
                duration: 600,
                easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            });

            logoOpacity.value = withTiming(0, {
                duration: 500,
            });

            containerOpacity.value = withTiming(0, {
                duration: 600
            }, (finished) => {
                if (finished) {
                    runOnJS(onAnimationComplete)();
                }
            });
        }, 800);

        return () => clearTimeout(timer);
    }, [onAnimationComplete]);

    return (
        <Animated.View style={[styles.container, animatedContainerStyle]}>
            <View style={styles.background} />
            <Animated.View style={animatedLogoStyle}>
                <Image
                    source={require('../../assets/icon.png')}
                    style={styles.logo}
                    contentFit="contain"
                    priority="high"
                />
            </Animated.View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backgroundColor: '#FFFFFF',
    },
    background: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#FFFFFF',
    },
    logo: {
        width: ICON_SIZE,
        height: ICON_SIZE,
    },
});
