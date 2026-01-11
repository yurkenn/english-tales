import React from 'react';
import { Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme, Theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

type SocialProvider = 'google' | 'apple';

interface SocialAuthButtonProps {
    provider: SocialProvider;
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
}

const PROVIDER_CONFIG = {
    google: {
        icon: 'logo-google' as const,
        label: 'Continue with Google',
    },
    apple: {
        icon: 'logo-apple' as const,
        label: 'Continue with Apple',
    },
};

export const SocialAuthButton: React.FC<SocialAuthButtonProps> = ({
    provider,
    onPress,
    disabled,
    loading,
}) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const config = PROVIDER_CONFIG[provider];

    return (
        <TouchableOpacity
            style={[styles.button, disabled && styles.buttonDisabled]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator color={theme.colors.text} />
            ) : (
                <>
                    <Ionicons name={config.icon} size={20} color={theme.colors.text} />
                    <Text style={styles.text}>{config.label}</Text>
                </>
            )}
        </TouchableOpacity>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
    button: {
        flexDirection: 'row',
        height: 56,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        marginBottom: theme.spacing.lg,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    text: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.text,
    },
});
