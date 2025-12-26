import React, { useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter, Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FormField, AuthHeader, AuthDivider, SocialAuthButton, TermsCheckbox } from '@/components';
import { useTranslation } from 'react-i18next';
import { useToastStore } from '@/store/toastStore';
import { signupSchema } from '@/lib/validations';
import { signUp, signInWithGoogle } from '@/services/auth';
import { handleAuthError } from '@/utils/errorHandler';

export default function SignupScreen() {
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; terms?: string }>({});
    const toastActions = useToastStore((state) => state.actions);

    const validateTerms = (): boolean => {
        if (!termsAccepted) {
            setErrors((prev) => ({ ...prev, terms: t('auth.signup.acceptTerms', 'You must accept the Terms of Service') }));
            return false;
        }
        setErrors((prev) => ({ ...prev, terms: undefined }));
        return true;
    };

    const handleSignup = async () => {
        if (!validateTerms()) return;

        const result = signupSchema.safeParse({ name, email, password });
        if (!result.success) {
            const fieldErrors: { name?: string; email?: string; password?: string } = {};
            result.error.issues.forEach((issue) => {
                if (issue.path[0]) {
                    fieldErrors[issue.path[0] as 'name' | 'email' | 'password'] = issue.message;
                }
            });
            setErrors((prev) => ({ ...prev, ...fieldErrors }));
            return;
        }

        setErrors({});
        setLoading(true);
        try {
            await signUp(email, password, name);
        } catch (error: any) {
            handleAuthError(error, { fallbackMessage: t('auth.signup.failed', 'Signup failed') });
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        if (!validateTerms()) return;

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

    const handleTermsToggle = () => {
        setTermsAccepted(!termsAccepted);
        if (errors.terms) setErrors((prev) => ({ ...prev, terms: undefined }));
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <ScrollView
                contentContainerStyle={[styles.content, { paddingTop: insets.top + (theme.spacing.xxxl * 2), paddingBottom: insets.bottom + theme.spacing.xl }]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <Pressable style={[styles.backButton, { top: insets.top + 20 }]} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </Pressable>

                <AuthHeader title={t('auth.signup.title', 'Create Account')} subtitle={t('auth.signup.subtitle', 'Start your English reading adventure today')} />

                <View style={styles.form}>
                    <FormField
                        icon="person-outline"
                        placeholder={t('auth.signup.fullName', 'Full Name')}
                        value={name}
                        onChangeText={(text) => {
                            setName(text);
                            if (errors.name) setErrors({ ...errors, name: undefined });
                        }}
                        error={errors.name}
                        containerStyle={styles.fieldContainer}
                    />
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
                        placeholder={t('auth.signup.password', 'Password')}
                        value={password}
                        onChangeText={(text) => {
                            setPassword(text);
                            if (errors.password) setErrors({ ...errors, password: undefined });
                        }}
                        secureTextEntry
                        showPasswordToggle
                        error={errors.password}
                        helperText={t('auth.signup.passwordHint', 'Must be at least 6 characters')}
                        containerStyle={styles.fieldContainer}
                    />

                    <TermsCheckbox checked={termsAccepted} onToggle={handleTermsToggle} error={errors.terms} />

                    <Pressable
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleSignup}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={theme.colors.textInverse} />
                        ) : (
                            <Text style={styles.buttonText}>{t('auth.signup.title', 'Sign Up')}</Text>
                        )}
                    </Pressable>
                </View>

                <AuthDivider text={t('auth.signup.or', 'or')} />

                <SocialAuthButton provider="google" onPress={handleGoogleSignIn} disabled={loading} />

                <View style={styles.footer}>
                    <Text style={styles.footerText}>{t('auth.signup.hasAccount', 'Already have an account? ')}</Text>
                    <Link href="/login" asChild>
                        <Pressable>
                            <Text style={styles.linkText}>{t('profile.login', 'Log In')}</Text>
                        </Pressable>
                    </Link>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        flexGrow: 1,
        paddingHorizontal: theme.spacing.lg,
    },
    backButton: {
        position: 'absolute',
        left: 20,
        zIndex: 10,
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.surface,
        ...theme.shadows.sm,
    },
    form: {
        gap: theme.spacing.lg,
    },
    fieldContainer: {
        marginBottom: 0,
    },
    button: {
        height: 56,
        backgroundColor: theme.colors.primary,
        borderRadius: theme.radius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: theme.spacing.md,
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
        marginTop: theme.spacing.xxxl,
        marginBottom: theme.spacing.lg,
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
}));
