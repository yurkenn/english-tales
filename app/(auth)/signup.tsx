import React, { useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter, Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FormField } from '@/components';
import { useToastStore } from '@/store/toastStore';
import { signupSchema } from '@/lib/validations';
import { signUp, signInWithGoogle } from '@/services/auth';

export default function SignupScreen() {
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; terms?: string }>({});
    const toastActions = useToastStore((state) => state.actions);

    const validateTerms = (): boolean => {
        if (!termsAccepted) {
            setErrors((prev) => ({ ...prev, terms: 'You must accept the Terms of Service' }));
            return false;
        }
        setErrors((prev) => ({ ...prev, terms: undefined }));
        return true;
    };

    const handleSignup = async () => {
        // Validate terms first
        if (!validateTerms()) return;

        // Validate form
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
            // AuthContext will handle redirect
        } catch (error: any) {
            toastActions.error(error.message || 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        // Validate terms first for Google sign-in too
        if (!validateTerms()) return;

        setLoading(true);
        try {
            await signInWithGoogle();
            // AuthContext will handle redirect
        } catch (error: any) {
            if (error.message !== 'Sign in was cancelled') {
                toastActions.error(error.message || 'Google sign-in failed');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleTermsToggle = () => {
        setTermsAccepted(!termsAccepted);
        if (errors.terms) {
            setErrors((prev) => ({ ...prev, terms: undefined }));
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView
                contentContainerStyle={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 20 }]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Back Button */}
                <Pressable style={[styles.backButton, { top: insets.top + 10 }]} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </Pressable>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Start your English reading adventure today</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <FormField
                        icon="person-outline"
                        placeholder="Full Name"
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
                        placeholder="Email"
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
                        placeholder="Password"
                        value={password}
                        onChangeText={(text) => {
                            setPassword(text);
                            if (errors.password) setErrors({ ...errors, password: undefined });
                        }}
                        secureTextEntry
                        error={errors.password}
                        helperText="Must be at least 6 characters"
                        containerStyle={styles.fieldContainer}
                    />

                    {/* Terms of Service Checkbox */}
                    <View style={styles.termsContainer}>
                        <Pressable onPress={handleTermsToggle} style={styles.checkbox} hitSlop={10}>
                            <Ionicons
                                name={termsAccepted ? "checkbox" : "square-outline"}
                                size={24}
                                color={errors.terms ? theme.colors.error : (termsAccepted ? theme.colors.primary : theme.colors.textSecondary)}
                            />
                        </Pressable>
                        <View style={styles.termsTextContainer}>
                            <Text style={styles.termsText}>
                                I agree to the{' '}
                                <Text style={styles.termsLink} onPress={() => router.push('/legal/terms')}>
                                    Terms of Service
                                </Text>
                                {' '}and{' '}
                                <Text style={styles.termsLink} onPress={() => router.push('/legal/privacy')}>
                                    Privacy Policy
                                </Text>
                            </Text>
                            {errors.terms && <Text style={styles.termsError}>{errors.terms}</Text>}
                        </View>
                    </View>

                    <Pressable
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleSignup}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={theme.colors.textInverse} />
                        ) : (
                            <Text style={styles.buttonText}>Sign Up</Text>
                        )}
                    </Pressable>
                </View>

                {/* Divider */}
                <View style={styles.dividerContainer}>
                    <View style={styles.divider} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.divider} />
                </View>

                {/* Social Auth */}
                <Pressable
                    style={[styles.googleButton, loading && styles.buttonDisabled]}
                    onPress={handleGoogleSignIn}
                    disabled={loading}
                >
                    <Ionicons name="logo-google" size={20} color={theme.colors.text} />
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                </Pressable>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Already have an account? </Text>
                    <Link href="/login" asChild>
                        <Pressable>
                            <Text style={styles.linkText}>Log In</Text>
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
    button: {
        height: 56,
        backgroundColor: theme.colors.primary,
        borderRadius: theme.radius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.md,
        marginTop: theme.spacing.md,
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
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: theme.spacing.xl,
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
    googleButton: {
        flexDirection: 'row',
        height: 56,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        marginBottom: theme.spacing.xl,
    },
    googleButtonText: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.text,
    },
    termsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing.md,
        marginTop: theme.spacing.sm,
    },
    checkbox: {
        marginTop: 2,
    },
    termsTextContainer: {
        flex: 1,
    },
    termsText: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textSecondary,
        lineHeight: 20,
    },
    termsLink: {
        color: theme.colors.primary,
        fontWeight: theme.typography.weight.semibold,
    },
    termsError: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.error,
        marginTop: theme.spacing.xs,
    },
}));
