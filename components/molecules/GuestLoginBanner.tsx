import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useTranslation } from 'react-i18next'
import { haptics } from '@/utils/haptics'

interface GuestLoginBannerProps {
    onSignInPress: () => void
    onDismiss?: () => void
}

export const GuestLoginBanner: React.FC<GuestLoginBannerProps> = ({
    onSignInPress,
    onDismiss,
}) => {
    const { theme } = useUnistyles()
    const { t } = useTranslation()

    const handleSignIn = () => {
        haptics.selection()
        onSignInPress()
    }

    const handleDismiss = () => {
        haptics.light()
        onDismiss?.()
    }

    return (
        <Animated.View entering={FadeInDown.duration(400).springify()} style={styles.container}>
            <LinearGradient
                colors={[theme.colors.primary, theme.colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                {/* Dismiss button */}
                {onDismiss && (
                    <Pressable style={styles.dismissButton} onPress={handleDismiss}>
                        <Ionicons name="close" size={18} color="rgba(255,255,255,0.7)" />
                    </Pressable>
                )}

                {/* Icon */}
                <View style={styles.iconContainer}>
                    <Ionicons name="person-circle-outline" size={40} color="#FFFFFF" />
                </View>

                {/* Content */}
                <View style={styles.textContainer}>
                    <Text style={styles.title}>
                        {t('auth.guestBanner.title', 'Unlock All Features')}
                    </Text>
                    <Text style={styles.subtitle}>
                        {t('auth.guestBanner.subtitle', 'Sign in to sync your progress, write reviews, and join the community!')}
                    </Text>
                </View>

                {/* CTA Button */}
                <Pressable
                    style={({ pressed }) => [styles.ctaButton, pressed && { opacity: 0.9 }]}
                    onPress={handleSignIn}
                >
                    <Ionicons name="log-in-outline" size={18} color={theme.colors.primary} />
                    <Text style={[styles.ctaText, { color: theme.colors.primary }]}>
                        {t('auth.guestBanner.cta', 'Sign In / Sign Up')}
                    </Text>
                </Pressable>
            </LinearGradient>
        </Animated.View>
    )
}

const styles = StyleSheet.create((theme) => ({
    container: {
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
        borderRadius: 16,
        overflow: 'hidden',
        ...theme.shadows.md,
    },
    gradient: {
        padding: theme.spacing.lg,
        alignItems: 'center',
        position: 'relative',
    },
    dismissButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.md,
    },
    textContainer: {
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    title: {
        fontSize: theme.typography.size.xl,
        fontWeight: theme.typography.weight.bold,
        color: '#FFFFFF',
        marginBottom: 6,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: theme.typography.size.sm,
        color: 'rgba(255,255,255,0.85)',
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: theme.spacing.md,
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FFFFFF',
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: 12,
        ...theme.shadows.sm,
    },
    ctaText: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.bold,
    },
}))
