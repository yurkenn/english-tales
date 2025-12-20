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

const { width, height } = Dimensions.get('window');
// Expo splash images are usually centered. We'll use the splash image directly
// to ensure pixel-perfect match with the native splash.

interface AnimatedSplashScreenProps {
    onAnimationComplete: () => void;
}

export const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({
    onAnimationComplete,
}) => {
    const containerOpacity = useSharedValue(1);
    const contentScale = useSharedValue(1);
    const contentOpacity = useSharedValue(1);

    const animatedContainerStyle = useAnimatedStyle(() => ({
        opacity: containerOpacity.value,
    }));

    const animatedContentStyle = useAnimatedStyle(() => ({
        transform: [{ scale: contentScale.value }],
        opacity: contentOpacity.value,
    }));

    useEffect(() => {
        // Reduced initial delay for faster feedback
        const timer = setTimeout(() => {
            // Subtle premium transition: slight zoom in while fading out
            contentScale.value = withTiming(1.05, {
                duration: 800,
                easing: Easing.out(Easing.quad),
            });

            contentOpacity.value = withTiming(0, {
                duration: 600,
            });

            containerOpacity.value = withTiming(0, {
                duration: 800,
                easing: Easing.out(Easing.quad),
            }, (finished) => {
                if (finished) {
                    runOnJS(onAnimationComplete)();
                }
            });
        }, 400); // Small pause to let the user see the "readiness"

        return () => clearTimeout(timer);
    }, [onAnimationComplete]);

    return (
        <Animated.View style={[styles.container, animatedContainerStyle]}>
            <Animated.View style={[styles.content, animatedContentStyle]}>
                <Image
                    source={require('../../assets/splash.png')}
                    style={styles.splashImage}
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
        backgroundColor: '#FFFFFF', // Matches app.json splash backgroundColor
        zIndex: 9999,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    splashImage: {
        width: width,
        height: height,
    },
});
