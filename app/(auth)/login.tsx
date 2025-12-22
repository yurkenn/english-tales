import React, { useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter, Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FormField, AuthHeader, AuthDivider, SocialAuthButton } from '@/components';
import { useTranslation } from 'react-i18next';
import { useToastStore } from '@/store/toastStore';
import { loginSchema } from '@/lib/validations';
import { signIn, signInAnonymously, signInWithGoogle } from '@/services/auth';
import { handleAuthError } from '@/utils/errorHandler';

export default function LoginScreen() {
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    const handleLogin = async () => {
        const result = loginSchema.safeParse({ email, password });
        if (!result.success) {
            const fieldErrors: { email?: string; password?: string } = {};
            result.error.issues.forEach((issue) => {
                if (issue.path[0]) {
                    fieldErrors[issue.path[0] as 'email' | 'password'] = issue.message;
                }
            });
            setErrors(fieldErrors);
            return;
        }

        setErrors({});
        setLoading(true);
        try {
            await signIn(email, password);
        } catch (error: any) {
            handleAuthError(error);
        } finally {
            setLoading(false);
        }
    };

    const handleGuestLogin = async () => {
        setLoading(true);
        try {
            await signInAnonymously();
            router.replace('/(tabs)');
        } catch (error: any) {
            handleAuthError(error, { fallbackMessage: t('auth.login.guestFailed', 'Could not sign in as guest') });
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        try {
            await signInWithGoogle();
        } catch (error: any) {
            if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
                handleAuthError(error);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <View style={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}>
                <AuthHeader title={t('auth.login.title', 'Welcome Back')} subtitle={t('auth.login.subtitle', 'Sign in to continue your reading journey')} />

                <View style={styles.form}>
                    <FormField
                        icon="mail-outline"
                        placeholder={t('common.email', 'Email')}
                        value={email}
                        onChangeText={(text) => {
                            setEmail(text);
                            if (errors.email) setErrors({ ...errors, email: undefined });
                        }}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        error={errors.email}
                        containerStyle={styles.fieldContainer}
                    />
                    <FormField
                        icon="lock-closed-outline"
                        placeholder={t('auth.login.password', 'Password')}
                        value={password}
                        onChangeText={(text) => {
                            setPassword(text);
                            if (errors.password) setErrors({ ...errors, password: undefined });
                        }}
                        secureTextEntry
                        showPasswordToggle
                        error={errors.password}
                        containerStyle={styles.fieldContainer}
                    />

                    <Pressable style={styles.forgotPassword} onPress={() => router.push('/forgot-password')}>
                        <Text style={styles.linkText}>{t('auth.login.forgotPassword', 'Forgot Password?')}</Text>
                    </Pressable>

                    <Pressable
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={theme.colors.textInverse} />
                        ) : (
                            <Text style={styles.buttonText}>{t('profile.login', 'Log In')}</Text>
                        )}
                    </Pressable>
                </View>

                <AuthDivider />

                <SocialAuthButton provider="google" onPress={handleGoogleSignIn} disabled={loading} />

                <Pressable onPress={handleGuestLogin} style={styles.guestButton}>
                    <Text style={styles.guestButtonText}>{t('auth.login.guest', 'Continue as Guest')}</Text>
                </Pressable>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>{t('auth.login.noAccount', "Don't have an account? ")}</Text>
                    <Link href="/signup" asChild>
                        <Pressable>
                            <Text style={styles.linkText}>{t('auth.signup.title', 'Sign Up')}</Text>
                        </Pressable>
                    </Link>
                </View>
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
    form: {
        gap: theme.spacing.lg,
    },
    fieldContainer: {
        marginBottom: theme.spacing.xs,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
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
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 'auto',
    },
    footerText: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
    },
    linkText: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.primary,
    },
    guestButton: {
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        marginBottom: theme.spacing.lg,
    },
    guestButtonText: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
        textDecorationLine: 'underline',
    },
}));
