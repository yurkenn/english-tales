import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Image, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter, Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { signIn, signInAnonymously } from '@/services/auth';

export default function LoginScreen() {
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password.');
            return;
        }

        setLoading(true);
        try {
            await signIn(email, password);
            // AuthContext will handle redirect
        } catch (error: any) {
            Alert.alert('Login Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGuestLogin = async () => {
        setLoading(true);
        try {
            await signInAnonymously();
        } catch (error: any) {
            Alert.alert('Error', 'Could not sign in as guest');
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
                    <View style={styles.inputContainer}>
                        <Ionicons name="mail-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor={theme.colors.textMuted}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>
                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor={theme.colors.textMuted}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

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
                    <Pressable style={styles.socialButton}>
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
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xl,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        height: 56,
        paddingHorizontal: theme.spacing.lg,
    },
    inputIcon: {
        marginRight: theme.spacing.md,
    },
    input: {
        flex: 1,
        fontSize: theme.typography.size.md,
        color: theme.colors.text,
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
