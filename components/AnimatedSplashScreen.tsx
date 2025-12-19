import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    runOnJS,
    Easing,
} from 'react-native-reanimated';
import { Image } from 'expo-image';

const ICON_SIZE = 120;

interface AnimatedSplashScreenProps {
    onAnimationComplete: () => void;
}

/**
 * AnimatedSplashScreen component using Reanimated.
 * Clean and simple fade-in/fade-out animation.
 */
export const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({
    onAnimationComplete,
}) => {
    const logoOpacity = useSharedValue(0);
    const logoScale = useSharedValue(0.9);
    const containerOpacity = useSharedValue(1);

    const animatedLogoStyle = useAnimatedStyle(() => ({
        opacity: logoOpacity.value,
        transform: [{ scale: logoScale.value }],
    }));

    const animatedContainerStyle = useAnimatedStyle(() => ({
        opacity: containerOpacity.value,
    }));

    useEffect(() => {
        // Fade in logo with subtle scale
        logoOpacity.value = withTiming(1, {
            duration: 500,
            easing: Easing.out(Easing.ease),
        });
        logoScale.value = withTiming(1, {
            duration: 500,
            easing: Easing.out(Easing.ease),
        });

        // Wait and then fade out
        const timer = setTimeout(() => {
            containerOpacity.value = withTiming(0, { duration: 400 }, (finished) => {
                if (finished) {
                    runOnJS(onAnimationComplete)();
                }
            });
        }, 1500);

        return () => clearTimeout(timer);
    }, [onAnimationComplete]);

    return (
        <Animated.View style={[styles.container, animatedContainerStyle]}>
            <View style={styles.background} />
            <Animated.View style={animatedLogoStyle}>
                <Image
                    source={require('../assets/icon.png')}
                    style={styles.logo}
                    contentFit="contain"
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
