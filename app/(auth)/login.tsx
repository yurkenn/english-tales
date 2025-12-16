import React, { useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter, Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FormField } from '@/components';
import { useToastStore } from '@/store/toastStore';
import { loginSchema } from '@/lib/validations';
import { signIn, signInAnonymously, signInWithGoogle } from '@/services/auth';

export default function LoginScreen() {
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const toastActions = useToastStore((state) => state.actions);

    const handleLogin = async () => {
        // Validate form
        const result = loginSchema.safeParse({ email, password });
        if (!result.success) {
            const fieldErrors: { email?: string; password?: string } = {};
            result.error.issues.forEach((err) => {
                if (err.path[0]) {
                    fieldErrors[err.path[0] as 'email' | 'password'] = err.message;
                }
            });
            setErrors(fieldErrors);
            return;
        }

        setErrors({});
        setLoading(true);
        try {
            await signIn(email, password);
            // AuthContext will handle redirect
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Login failed';
            toastActions.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleGuestLogin = async () => {
        setLoading(true);
        try {
            await signInAnonymously();
            // AuthContext will handle redirect
        } catch (error: unknown) {
            toastActions.error('Could not sign in as guest');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        try {
            await signInWithGoogle();
            // AuthContext will handle redirect
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Google sign-in failed';
            if (message !== 'Sign in was cancelled') {
                toastActions.error(message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Sign in to continue your reading journey</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <FormField
                        icon="mail-outline"
                        placeholder="Email"
                        value={email}
                        onChangeText={(text) => {
                            setEmail(text);
                            if (errors.email) {
                                setErrors({ ...errors, email: undefined });
                            }
                        }}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        error={errors.email}
                        containerStyle={styles.fieldContainer}
                    />
                    <FormField
                        icon="lock-closed-outline"
                        placeholder="Password"
                        value={password}
                        onChangeText={(text) => {
                            setPassword(text);
                            if (errors.password) {
                                setErrors({ ...errors, password: undefined });
                            }
                        }}
                        secureTextEntry
                        error={errors.password}
                        containerStyle={styles.fieldContainer}
                    />

                    <Pressable style={styles.forgotPassword}>
                        <Text style={styles.linkText}>Forgot Password?</Text>
                    </Pressable>

                    <Pressable
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={theme.colors.textInverse} />
                        ) : (
                            <Text style={styles.buttonText}>Log In</Text>
                        )}
                    </Pressable>
                </View>

                {/* Divider */}
                <View style={styles.dividerContainer}>
                    <View style={styles.divider} />
                    <Text style={styles.dividerText}>or continue with</Text>
                    <View style={styles.divider} />
                </View>

                {/* Social Auth */}
                <View style={styles.socialRow}>
                    <Pressable
                        style={[styles.socialButton, loading && styles.buttonDisabled]}
                        onPress={handleGoogleSignIn}
                        disabled={loading}
                    >
                        <Ionicons name="logo-google" size={24} color={theme.colors.text} />
                    </Pressable>
                    <Pressable style={styles.socialButton}>
                        <Ionicons name="logo-apple" size={24} color={theme.colors.text} />
                    </Pressable>
                </View>

                {/* Guest Login */}
                <Pressable onPress={handleGuestLogin} style={styles.guestButton}>
                    <Text style={styles.guestButtonText}>Continue as Guest</Text>
                </Pressable>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Don't have an account? </Text>
                    <Link href="/signup" asChild>
                        <Pressable>
                            <Text style={styles.linkText}>Sign Up</Text>
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
    header: {
        marginBottom: theme.spacing.xxxxl,
    },
    title: {
        fontSize: 32,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
    },
    subtitle: {
        fontSize: theme.typography.size.lg,
        color: theme.colors.textSecondary,
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
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: theme.spacing.xxxxl,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: theme.colors.borderLight,
    },
    dividerText: {
        marginHorizontal: theme.spacing.lg,
        color: theme.colors.textMuted,
        fontSize: theme.typography.size.sm,
    },
    socialRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: theme.spacing.xl,
        marginBottom: theme.spacing.xxxxl,
    },
    socialButton: {
        width: 56,
        height: 56,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
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
