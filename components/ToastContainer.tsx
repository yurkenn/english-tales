import React from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useToastStore, ToastType } from '@/store/toastStore';
import { useEffect, useRef } from 'react';

const ToastItem: React.FC<{
    id: string;
    message: string;
    type: ToastType;
    onDismiss: () => void;
}> = ({ id, message, type, onDismiss }) => {
    const { theme } = useUnistyles();
    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                tension: 50,
                friction: 8,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();
    }, [translateY, opacity]);

    const iconMap: Record<ToastType, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
        success: { name: 'checkmark-circle', color: theme.colors.success },
        error: { name: 'close-circle', color: theme.colors.error },
        info: { name: 'information-circle', color: theme.colors.primary },
        warning: { name: 'warning', color: theme.colors.star },
    };

    const { name, color } = iconMap[type];

    return (
        <Animated.View
            style={[
                styles.toast,
                { transform: [{ translateY }], opacity },
            ]}
        >
            <Ionicons name={name} size={24} color={color} />
            <Text style={styles.message} numberOfLines={2}>
                {message}
            </Text>
            <Pressable onPress={onDismiss} hitSlop={10}>
                <Ionicons name="close" size={20} color={theme.colors.textMuted} />
            </Pressable>
        </Animated.View>
    );
};

export const ToastContainer: React.FC = () => {
    const insets = useSafeAreaInsets();
    const { toasts, actions } = useToastStore();

    if (toasts.length === 0) return null;

    return (
        <View style={[styles.container, { top: insets.top + 10 }]}>
            {toasts.map((toast) => (
                <ToastItem
                    key={toast.id}
                    id={toast.id}
                    message={toast.message}
                    type={toast.type}
                    onDismiss={() => actions.hide(toast.id)}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        position: 'absolute',
        left: theme.spacing.lg,
        right: theme.spacing.lg,
        zIndex: 9999,
        gap: theme.spacing.sm,
    },
    toast: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.radius.xl,
        ...theme.shadows.lg,
    },
    message: {
        flex: 1,
        fontSize: theme.typography.size.md,
        color: theme.colors.text,
    },
}));
