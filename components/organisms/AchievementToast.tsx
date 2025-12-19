import React, { useEffect, useRef } from 'react';
import { Animated, Text, View, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useAchievementsStore } from '@/store/achievementsStore';

export const AchievementToast: React.FC = () => {
    const { theme } = useUnistyles();
    const { pendingUnlock, actions } = useAchievementsStore();
    const slideAnim = useRef(new Animated.Value(-100)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (pendingUnlock) {
            // Animate in
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            // Auto dismiss after 4 seconds
            const timer = setTimeout(() => {
                Animated.parallel([
                    Animated.timing(slideAnim, {
                        toValue: -100,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacityAnim, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ]).start(() => actions.dismissPending());
            }, 4000);

            return () => clearTimeout(timer);
        }
    }, [pendingUnlock]);

    if (!pendingUnlock) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ translateY: slideAnim }],
                    opacity: opacityAnim,
                },
            ]}
        >
            <Pressable style={styles.content} onPress={actions.dismissPending}>
                <Text style={styles.icon}>{pendingUnlock.icon}</Text>
                <View style={styles.textContainer}>
                    <Text style={styles.title}>🎉 Achievement Unlocked!</Text>
                    <Text style={styles.name}>{pendingUnlock.title}</Text>
                    <Text style={styles.description}>{pendingUnlock.description}</Text>
                </View>
            </Pressable>
        </Animated.View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        position: 'absolute',
        top: 60,
        left: 16,
        right: 16,
        zIndex: 1000,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.lg,
        borderRadius: theme.radius.xl,
        ...theme.shadows.lg,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.primary,
    },
    icon: {
        fontSize: 40,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.primary,
        fontWeight: theme.typography.weight.semibold,
    },
    name: {
        fontSize: theme.typography.size.lg,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    description: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textSecondary,
    },
}));
