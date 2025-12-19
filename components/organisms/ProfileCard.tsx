import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { OptimizedImage } from '../atoms';

interface ProfileCardProps {
    photoURL?: string | null;
    displayName?: string | null;
    email?: string | null;
    isAnonymous?: boolean;
    onEditPress?: () => void;
    onSignInPress?: () => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
    photoURL,
    displayName,
    email,
    isAnonymous = false,
    onEditPress,
    onSignInPress,
}) => {
    const { theme } = useUnistyles();

    const avatarUri = photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(isAnonymous ? 'Guest' : displayName || 'User')}&background=EA2A33&color=fff&bold=true`;
    const name = isAnonymous ? 'Guest User' : (displayName || 'Reader');
    const subtitle = isAnonymous ? 'Sign in to sync your progress' : email;

    return (
        <View style={styles.container}>
            {/* Decorative gradient background */}
            <LinearGradient
                colors={[`${theme.colors.primary}15`, 'transparent']}
                style={styles.gradientBg}
            />

            {/* Avatar with ring */}
            <View style={styles.avatarWrapper}>
                <LinearGradient
                    colors={[theme.colors.primary, theme.colors.primaryDark]}
                    style={styles.avatarRing}
                >
                    <View style={styles.avatarInner}>
                        <OptimizedImage source={{ uri: avatarUri }} style={styles.avatar} />
                    </View>
                </LinearGradient>
                {!isAnonymous && (
                    <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                    </View>
                )}
            </View>

            {/* Name & Email */}
            <Text style={styles.userName}>{name}</Text>
            <Text style={styles.userEmail}>{subtitle}</Text>

            {/* Anonymous CTA */}
            {isAnonymous && onSignInPress && (
                <Pressable style={styles.signInButton} onPress={onSignInPress}>
                    <LinearGradient
                        colors={[theme.colors.primary, theme.colors.primaryDark]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.signInGradient}
                    >
                        <Ionicons name="log-in-outline" size={18} color="#FFFFFF" />
                        <Text style={styles.signInText}>Sign In / Sign Up</Text>
                    </LinearGradient>
                </Pressable>
            )}
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        alignItems: 'center',
        paddingVertical: theme.spacing.xxl,
        paddingHorizontal: theme.spacing.xl,
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xxl,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        overflow: 'hidden',
    },
    gradientBg: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 100,
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: theme.spacing.md,
    },
    avatarRing: {
        width: 88,
        height: 88,
        borderRadius: 44,
        padding: 3,
    },
    avatarInner: {
        flex: 1,
        borderRadius: 42,
        backgroundColor: theme.colors.surface,
        padding: 2,
    },
    avatar: {
        flex: 1,
        borderRadius: 40,
        backgroundColor: theme.colors.borderLight,
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: theme.colors.success,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: theme.colors.surface,
    },
    userName: {
        fontSize: theme.typography.size.xxl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.xxs,
    },
    userEmail: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
    },
    signInButton: {
        marginTop: theme.spacing.lg,
        borderRadius: theme.radius.full,
        overflow: 'hidden',
    },
    signInGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.md,
    },
    signInText: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.bold,
        color: '#FFFFFF',
    },
}));
