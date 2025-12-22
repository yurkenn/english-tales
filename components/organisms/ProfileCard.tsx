import React from 'react';
import { View, Text, Pressable, Image, ImageSourcePropType } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { OptimizedImage } from '../atoms';

// Default mascot avatar for users without profile photo
const DEFAULT_AVATAR = require('@/assets/default-avatar.png');

interface ProfileCardProps {
    photoURL?: string | null;
    displayName?: string | null;
    email?: string | null;
    bio?: string | null;
    socialLinks?: {
        instagram?: string;
        twitter?: string;
        website?: string;
        github?: string;
    };
    isAnonymous?: boolean;
    onEditPress?: () => void;
    onSignInPress?: () => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
    photoURL,
    displayName,
    email,
    bio,
    socialLinks,
    isAnonymous = false,
    onEditPress,
    onSignInPress,
}) => {
    const { theme } = useUnistyles();

    const renderSocialLinks = () => {
        if (!socialLinks) return null;
        const links = [
            { icon: 'logo-instagram', url: socialLinks.instagram, key: 'instagram' },
            { icon: 'logo-twitter', url: socialLinks.twitter, key: 'twitter' },
            { icon: 'globe-outline', url: socialLinks.website, key: 'website' },
            { icon: 'logo-github', url: socialLinks.github, key: 'github' },
        ].filter(l => l.url);

        if (links.length === 0) return null;

        return (
            <View style={styles.socialRow}>
                {links.map(link => (
                    <View key={link.key} style={styles.socialIcon}>
                        <Ionicons name={link.icon as any} size={14} color={theme.colors.textSecondary} />
                    </View>
                ))}
            </View>
        );
    };

    const avatarSource: ImageSourcePropType = photoURL ? { uri: photoURL } : DEFAULT_AVATAR;
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
                        <Image source={avatarSource} style={styles.avatar} />
                    </View>
                </LinearGradient>
                {!isAnonymous && (
                    <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                    </View>
                )}
            </View>

            {/* Name & Email */}
            <View style={styles.nameRow}>
                <Text style={styles.userName}>{name}</Text>
                {onEditPress && !isAnonymous && (
                    <Pressable onPress={onEditPress} style={styles.editButton}>
                        <Ionicons name="pencil" size={16} color={theme.colors.primary} />
                    </Pressable>
                )}
            </View>
            <Text style={styles.userEmail}>{subtitle}</Text>

            {bio && (
                <Text style={styles.bioText} numberOfLines={2}>{bio}</Text>
            )}

            {renderSocialLinks()}

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
        paddingVertical: theme.spacing.xl,
        paddingHorizontal: theme.spacing.xl,
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        overflow: 'hidden',
        ...theme.shadows.sm,
    },
    gradientBg: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 80,
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: theme.spacing.md,
    },
    avatarRing: {
        width: 90,
        height: 90,
        borderRadius: 45,
        padding: 2,
    },
    avatarInner: {
        flex: 1,
        borderRadius: 43,
        backgroundColor: theme.colors.surface,
        padding: 2,
    },
    avatar: {
        flex: 1,
        borderRadius: 41,
        backgroundColor: theme.colors.background,
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: theme.colors.success,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2.5,
        borderColor: theme.colors.surface,
    },
    userName: {
        fontSize: theme.typography.size.xxl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    userEmail: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textMuted,
        marginBottom: theme.spacing.sm,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        marginBottom: 2,
    },
    editButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.sm,
    },
    signInButton: {
        marginTop: theme.spacing.lg,
        borderRadius: 12,
        overflow: 'hidden',
        ...theme.shadows.sm,
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
    bioText: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginTop: theme.spacing.xs,
        paddingHorizontal: theme.spacing.md,
        lineHeight: 18,
    },
    socialRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: theme.spacing.md,
        gap: theme.spacing.md,
    },
    socialIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
}));
