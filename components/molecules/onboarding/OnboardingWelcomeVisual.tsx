/**
 * OnboardingWelcome - Animated Welcome Visual
 */
import { FC, memo, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    withDelay,
    withSequence,
} from 'react-native-reanimated';
import { useTheme, Theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

export const OnboardingWelcomeVisual: FC = memo(() => {
    const { theme } = useTheme();
    const styles = createStyles(theme);

    // Animation values
    const logoScale = useSharedValue(0);
    const logoOpacity = useSharedValue(0);
    const titleOpacity = useSharedValue(0);
    const titleTranslateY = useSharedValue(20);
    const sparkle1 = useSharedValue(0);
    const sparkle2 = useSharedValue(0);
    const sparkle3 = useSharedValue(0);

    useEffect(() => {
        // Logo entrance
        logoScale.value = withSpring(1, { damping: 12 });
        logoOpacity.value = withTiming(1, { duration: 500 });

        // Title entrance
        titleOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
        titleTranslateY.value = withDelay(300, withSpring(0, { damping: 12 }));

        // Sparkles
        sparkle1.value = withDelay(600, withSequence(
            withTiming(1, { duration: 300 }),
            withTiming(0.7, { duration: 1000 }),
        ));
        sparkle2.value = withDelay(800, withSequence(
            withTiming(1, { duration: 300 }),
            withTiming(0.7, { duration: 1000 }),
        ));
        sparkle3.value = withDelay(1000, withSequence(
            withTiming(1, { duration: 300 }),
            withTiming(0.7, { duration: 1000 }),
        ));
    }, []);

    const logoStyle = useAnimatedStyle(() => ({
        transform: [{ scale: logoScale.value }],
        opacity: logoOpacity.value,
    }));

    const titleStyle = useAnimatedStyle(() => ({
        opacity: titleOpacity.value,
        transform: [{ translateY: titleTranslateY.value }],
    }));

    const sparkle1Style = useAnimatedStyle(() => ({
        opacity: sparkle1.value,
        transform: [{ scale: sparkle1.value }],
    }));

    const sparkle2Style = useAnimatedStyle(() => ({
        opacity: sparkle2.value,
        transform: [{ scale: sparkle2.value }],
    }));

    const sparkle3Style = useAnimatedStyle(() => ({
        opacity: sparkle3.value,
        transform: [{ scale: sparkle3.value }],
    }));

    return (
        <View style={styles.container}>
            {/* Sparkles */}
            <Animated.View style={[styles.sparkle, styles.sparkle1, sparkle1Style]}>
                <Ionicons name="sparkles" size={24} color={theme.colors.warning} />
            </Animated.View>
            <Animated.View style={[styles.sparkle, styles.sparkle2, sparkle2Style]}>
                <Ionicons name="star" size={20} color={theme.colors.primary} />
            </Animated.View>
            <Animated.View style={[styles.sparkle, styles.sparkle3, sparkle3Style]}>
                <Ionicons name="sparkles" size={18} color={theme.colors.success} />
            </Animated.View>

            {/* Logo */}
            <Animated.View style={[styles.logoContainer, logoStyle]}>
                <View style={styles.logoBackground}>
                    <Ionicons name="book" size={64} color={theme.colors.primary} />
                </View>
            </Animated.View>

            {/* App Name */}
            <Animated.View style={titleStyle}>
                <Text style={styles.appName}>English Tales</Text>
                <Text style={styles.tagline}>Learn English Through Stories</Text>
            </Animated.View>

            {/* Feature Pills */}
            <View style={styles.pillsContainer}>
                <View style={[styles.pill, { backgroundColor: theme.colors.primary + '20' }]}>
                    <Text style={[styles.pillText, { color: theme.colors.primary }]}>📚 100+ Stories</Text>
                </View>
                <View style={[styles.pill, { backgroundColor: theme.colors.success + '20' }]}>
                    <Text style={[styles.pillText, { color: theme.colors.success }]}>🎯 All Levels</Text>
                </View>
                <View style={[styles.pill, { backgroundColor: theme.colors.warning + '20' }]}>
                    <Text style={[styles.pillText, { color: theme.colors.warning }]}>🌟 Free</Text>
                </View>
            </View>
        </View>
    );
});

OnboardingWelcomeVisual.displayName = 'OnboardingWelcomeVisual';

function createStyles(theme: Theme) {
    return StyleSheet.create({
        container: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
        },
        logoContainer: {
            marginBottom: theme.spacing.xl,
        },
        logoBackground: {
            width: 120,
            height: 120,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.primary + '15',
            alignItems: 'center',
            justifyContent: 'center',
            ...theme.shadows.lg,
        },
        appName: {
            fontSize: 32,
            fontWeight: 'bold',
            color: theme.colors.text,
            textAlign: 'center',
            marginBottom: theme.spacing.xs,
        },
        tagline: {
            fontSize: theme.typography.size.md,
            color: theme.colors.textMuted,
            textAlign: 'center',
        },
        pillsContainer: {
            flexDirection: 'row',
            gap: theme.spacing.sm,
            marginTop: theme.spacing.xl,
        },
        pill: {
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.xs,
            borderRadius: theme.radius.full,
        },
        pillText: {
            fontSize: theme.typography.size.sm,
            fontWeight: '600',
        },
        sparkle: {
            position: 'absolute',
        },
        sparkle1: {
            top: 40,
            right: 40,
        },
        sparkle2: {
            top: 100,
            left: 30,
        },
        sparkle3: {
            bottom: 80,
            right: 60,
        },
    });
}
