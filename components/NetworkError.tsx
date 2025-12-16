import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';

interface NetworkErrorProps {
    message?: string;
    onRetry?: () => void;
}

export const NetworkError: React.FC<NetworkErrorProps> = ({
    message = 'Something went wrong',
    onRetry,
}) => {
    const { theme } = useUnistyles();

    return (
        <View style={styles.container} accessibilityRole="alert">
            <View style={styles.iconContainer} accessibilityElementsHidden>
                <Ionicons
                    name="cloud-offline-outline"
                    size={64}
                    color={theme.colors.textMuted}
                />
            </View>
            <Text style={styles.title} accessibilityRole="header">Oops!</Text>
            <Text style={styles.message}>{message}</Text>
            {onRetry && (
                <Pressable
                    style={styles.retryButton}
                    onPress={onRetry}
                    accessibilityRole="button"
                    accessibilityLabel="Try again"
                    accessibilityHint="Retry loading the content"
                >
                    <Ionicons name="refresh" size={20} color={theme.colors.textInverse} />
                    <Text style={styles.retryText}>Try Again</Text>
                </Pressable>
            )}
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.xl,
        gap: theme.spacing.md,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: `${theme.colors.error}10`,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.md,
    },
    title: {
        fontSize: theme.typography.size.xxl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    message: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        backgroundColor: theme.colors.primary,
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.radius.full,
        marginTop: theme.spacing.lg,
        ...theme.shadows.md,
    },
    retryText: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.textInverse,
    },
}));
