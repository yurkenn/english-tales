import React, { useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FormField } from '@/components';
import { useTranslation } from 'react-i18next';
import { useToastStore } from '@/store/toastStore';
import { sendPasswordResetEmail } from '@/services/auth';
import { handleAuthError } from '@/utils/errorHandler';
import { z } from 'zod';

const emailSchema = z.string().min(1, 'Email is required').email('Please enter a valid email');

export default function ForgotPasswordScreen() {
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | undefined>();
    const [success, setSuccess] = useState(false);
    const toastActions = useToastStore((state) => state.actions);

    const handleResetPassword = async () => {
        // Validate email
        const result = emailSchema.safeParse(email);
        if (!result.success) {
            setError(result.error.issues[0]?.message);
            return;
        }

        setError(undefined);
        setLoading(true);
        try {
            await sendPasswordResetEmail(email);
            setSuccess(true);
            toastActions.success('Password reset email sent!');
        } catch (err: unknown) {
            handleAuthError(err);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <View style={styles.successContent}>
                    <View style={styles.successIconContainer}>
                        <Ionicons name="mail-open-outline" size={64} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.successTitle}>{t('settings.dialogs.changePassword.success', 'Check Your Email')}</Text>
                    <Text style={styles.successText}>
                        {t('auth.forgotPassword.successMessage', "We've sent a password reset link to")}{'\n'}
                        <Text style={styles.emailHighlight}>{email}</Text>
                    </Text>
                    <Text style={styles.successHint}>
                        {t('auth.forgotPassword.spamHint', "If you don't see the email, check your spam folder.")}
                    </Text>
                    <Pressable style={styles.button} onPress={() => router.replace('/login')}>
                        <Text style={styles.buttonText}>{t('auth.forgotPassword.backToLogin', 'Back to Login')}</Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}>
                {/* Back Button */}
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </Pressable>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="lock-open-outline" size={48} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.title}>{t('auth.forgotPassword.title', 'Forgot Password?')}</Text>
                    <Text style={styles.subtitle}>
                        {t('auth.forgotPassword.message', "No worries! Enter your email address and we'll send you a link to reset your password.")}
                    </Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <FormField
                        icon="mail-outline"
                        placeholder={t('common.email', 'Email')}
                        value={email}
                        onChangeText={(text) => {
                            setEmail(text);
                            if (error) setError(undefined);
                        }}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        error={error}
                        containerStyle={styles.fieldContainer}
                    />

                    <Pressable
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleResetPassword}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={theme.colors.textInverse} />
                        ) : (
                            <Text style={styles.buttonText}>{t('settings.dialogs.changePassword.title', 'Send Reset Link')}</Text>
                        )}
                    </Pressable>
                </View>

                {/* Footer */}
                <Pressable style={styles.backToLogin} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={16} color={theme.colors.primary} />
                    <Text style={styles.backToLoginText}>{t('auth.forgotPassword.backToLogin', 'Back to Login')}</Text>
                </Pressable>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        flex: 1,
        paddingHorizontal: theme.spacing.xl,
        justifyContent: 'center',
    },
    backButton: {
        position: 'absolute',
        top: 60,
        left: 20,
        zIndex: 10,
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.surface,
    },
    header: {
        alignItems: 'center',
        marginBottom: theme.spacing.xxxxl,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.xl,
    },
    title: {
        fontSize: theme.typography.size.xxxl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: theme.spacing.lg,
    },
    form: {
        gap: theme.spacing.lg,
    },
    fieldContainer: {
        marginBottom: theme.spacing.xs,
    },
    button: {
        height: 56,
        backgroundColor: theme.colors.primary,
        borderRadius: theme.radius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.md,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        fontSize: theme.typography.size.lg,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.textInverse,
    },
    backToLogin: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        marginTop: theme.spacing.xxxxl,
    },
    backToLoginText: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.primary,
    },
    // Success state styles
    successContent: {
        flex: 1,
        paddingHorizontal: theme.spacing.xl,
        justifyContent: 'center',
        alignItems: 'center',
    },
    successIconContainer: {
        width: 100,
        height: 100,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.xl,
    },
    successTitle: {
        fontSize: theme.typography.size.xxxl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
        textAlign: 'center',
    },
    successText: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: theme.spacing.md,
    },
    emailHighlight: {
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.text,
    },
    successHint: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textMuted,
        textAlign: 'center',
        marginBottom: theme.spacing.xxxxl,
    },
}));
