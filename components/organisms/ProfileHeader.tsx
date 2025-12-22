import React, { useEffect } from 'react';
import { View, Pressable, Dimensions, Linking, Image, ImageSourcePropType } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useAnimatedStyle,
    SharedValue,
    withTiming,
    useSharedValue,
    Easing,
} from 'react-native-reanimated';
import { Typography, Button, OptimizedImage } from '../atoms';
import { UserProfile } from '@/types';
import { haptics } from '@/utils/haptics';
import { useTranslation } from 'react-i18next';

// Default mascot avatar for users without profile photo
const DEFAULT_AVATAR = require('@/assets/defaultavatar.png');

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProfileHeaderProps {
    profile: UserProfile;
    isSelf?: boolean;
    relationship?: 'following' | 'none' | 'pending' | 'self';
    onFollowPress?: () => void;
    onEditPress?: () => void;
    onSocialPress?: (type: string, url: string) => void;
    actionLoading?: boolean;
    scrollY?: SharedValue<number>;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
    profile,
    isSelf,
    relationship,
    onFollowPress,
    onEditPress,
    onSocialPress,
    actionLoading,
    scrollY,
}) => {
    const { t } = useTranslation();
    const { theme } = useUnistyles();

    // Subtle entrance animation
    const opacity = useSharedValue(0);

    useEffect(() => {
        opacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const socialLinks = profile.socialLinks || {};
    const availableLinks = [
        { icon: 'logo-instagram', url: socialLinks.instagram, type: 'instagram', color: '#E4405F' },
        { icon: 'logo-twitter', url: socialLinks.twitter, type: 'twitter', color: '#1DA1F2' },
        { icon: 'globe-outline', url: socialLinks.website, type: 'website', color: theme.colors.text },
        { icon: 'logo-github', url: socialLinks.github, type: 'github', color: theme.colors.text },
    ].filter(l => l.url);

    const handleSocialPress = (type: string, url: string) => {
        haptics.light();
        if (onSocialPress) {
            onSocialPress(type, url);
        } else {
            // Default: open URL
            let fullUrl = url;
            if (type === 'instagram' && !url.startsWith('http')) {
                fullUrl = `https://instagram.com/${url}`;
            } else if (type === 'twitter' && !url.startsWith('http')) {
                fullUrl = `https://twitter.com/${url}`;
            } else if (type === 'github' && !url.startsWith('http')) {
                fullUrl = `https://github.com/${url}`;
            } else if (!url.startsWith('http')) {
                fullUrl = `https://${url}`;
            }
            Linking.openURL(fullUrl);
        }
    };

    return (
        <Animated.View
            style={[styles.container, animatedStyle]}
            collapsable={false}
        >
            {/* Background Gradient */}
            <LinearGradient
                colors={[`${theme.colors.primary}15`, `${theme.colors.primary}05`, 'transparent']}
                style={styles.backgroundGradient}
            />

            {/* Avatar with Gradient Ring */}
            <View style={styles.avatarSection}>
                <View style={styles.avatarWrapper}>
                    <LinearGradient
                        colors={[theme.colors.primary, '#FF6B6B', theme.colors.primaryLight]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.avatarRing}
                    >
                        <View style={styles.avatarInner}>
                            <Image
                                source={profile.photoURL ? { uri: profile.photoURL } : DEFAULT_AVATAR}
                                style={styles.avatar}
                            />
                        </View>
                    </LinearGradient>
                </View>
            </View>

            {/* Username */}
            <Typography style={styles.username}>
                {profile.displayName || 'Reader'}
            </Typography>
            <Typography style={styles.handle}>
                @{profile.displayName?.toLowerCase().replace(/\s+/g, '') || 'anonymous'}
            </Typography>

            {/* Stats Row - Clean Minimal Design */}
            <View style={styles.statsContainer}>
                <Pressable style={styles.statCard}>
                    <Typography style={styles.statValue}>{profile.followingCount || 0}</Typography>
                    <Typography style={styles.statLabel}>{t('social.following', 'Following')}</Typography>
                </Pressable>

                <View style={styles.statDivider} />

                <Pressable style={styles.statCard}>
                    <Typography style={styles.statValue}>{profile.followersCount || 0}</Typography>
                    <Typography style={styles.statLabel}>{t('social.followers', 'Followers')}</Typography>
                </Pressable>

                <View style={styles.statDivider} />

                <Pressable style={styles.statCard}>
                    <View style={styles.streakRow}>
                        <Typography style={styles.statValue}>{profile.streak || 0}</Typography>
                        <Typography style={styles.streakEmoji}>🔥</Typography>
                    </View>
                    <Typography style={styles.statLabel}>{t('profile.streak', 'Streak')}</Typography>
                </Pressable>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsRow}>
                {isSelf ? (
                    <>
                        <Pressable
                            style={({ pressed }) => [styles.editButton, pressed && { opacity: 0.7 }]}
                            onPress={onEditPress}
                        >
                            <Ionicons name="pencil-outline" size={16} color={theme.colors.text} />
                            <Typography style={styles.editButtonText}>
                                {t('profile.editProfile', 'Edit profile')}
                            </Typography>
                        </Pressable>

                        {/* Social Icons */}
                        {availableLinks.map(link => (
                            <Pressable
                                key={link.type}
                                style={({ pressed }) => [styles.socialIcon, pressed && { opacity: 0.5 }]}
                                onPress={() => handleSocialPress(link.type, link.url!)}
                            >
                                <Ionicons name={link.icon as any} size={20} color={link.color} />
                            </Pressable>
                        ))}
                    </>
                ) : (
                    <>
                        <Pressable
                            style={({ pressed }) => [
                                relationship === 'following' ? styles.editButton : styles.followButton,
                                pressed && { opacity: 0.7 }
                            ]}
                            onPress={onFollowPress}
                        >
                            <Ionicons
                                name={relationship === 'following' ? 'checkmark-circle' : 'person-add-outline'}
                                size={16}
                                color={relationship === 'following' ? theme.colors.text : '#FFFFFF'}
                            />
                            <Typography style={relationship === 'following' ? styles.editButtonText : styles.followButtonText}>
                                {relationship === 'following'
                                    ? t('social.following', 'Following')
                                    : t('social.follow', 'Follow')
                                }
                            </Typography>
                        </Pressable>

                        {/* Social Icons for other users */}
                        {availableLinks.map(link => (
                            <Pressable
                                key={link.type}
                                style={({ pressed }) => [styles.socialIcon, pressed && { opacity: 0.5 }]}
                                onPress={() => handleSocialPress(link.type, link.url!)}
                            >
                                <Ionicons name={link.icon as any} size={20} color={link.color} />
                            </Pressable>
                        ))}
                    </>
                )}
            </View>

            {/* Bio */}
            {profile.bio ? (
                <View style={styles.bioContainer}>
                    <Typography style={styles.bio}>{profile.bio}</Typography>
                </View>
            ) : isSelf ? (
                <Pressable style={styles.addBioButton} onPress={onEditPress}>
                    <Ionicons name="add-circle-outline" size={16} color={theme.colors.primary} />
                    <Typography style={styles.addBioText}>{t('profile.addBio', 'Add bio')}</Typography>
                </Pressable>
            ) : null}

            {/* Location */}
            {profile.location && (
                <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={14} color={theme.colors.textMuted} />
                    <Typography style={styles.locationText}>{profile.location}</Typography>
                </View>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        backgroundColor: theme.colors.background,
        alignItems: 'center',
        paddingTop: 24,
        paddingBottom: 20,
        paddingHorizontal: 16,
        position: 'relative',
        overflow: 'hidden',
    },
    backgroundGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 180,
    },
    avatarSection: {
        marginBottom: 12,
    },
    avatarWrapper: {
        position: 'relative',
        ...theme.shadows.md,
    },
    avatarRing: {
        width: 110,
        height: 110,
        borderRadius: 55,
        padding: 4,
    },
    avatarInner: {
        flex: 1,
        borderRadius: 51,
        overflow: 'hidden',
        backgroundColor: theme.colors.surface,
        padding: 3,
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 48,
    },
    username: {
        fontSize: theme.typography.size.xxl,
        fontWeight: '700',
        color: theme.colors.text,
        letterSpacing: -0.5,
    },
    handle: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textMuted,
        marginBottom: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        width: '100%',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 16,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: theme.colors.border,
        alignSelf: 'center',
    },
    statValue: {
        fontSize: theme.typography.size.xxl,
        fontWeight: '700',
        color: theme.colors.text,
    },
    statLabel: {
        fontSize: theme.typography.size.sm,
        fontWeight: '500',
        color: theme.colors.textMuted,
        marginTop: 4,
    },
    streakRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    streakEmoji: {
        fontSize: 16,
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        ...theme.shadows.sm,
    },
    editButtonText: {
        fontSize: theme.typography.size.md,
        fontWeight: '600',
        color: theme.colors.text,
    },
    followButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        backgroundColor: theme.colors.primary,
        ...theme.shadows.md,
    },
    followButtonText: {
        fontSize: theme.typography.size.md,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    socialIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.sm,
    },
    bioContainer: {
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginHorizontal: 8,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    bio: {
        fontSize: theme.typography.size.md,
        color: theme.colors.text,
        textAlign: 'center',
        lineHeight: 22,
    },
    addBioButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: `${theme.colors.primary}10`,
    },
    addBioText: {
        fontSize: theme.typography.size.md,
        color: theme.colors.primary,
        fontWeight: '600',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: theme.colors.surface,
    },
    locationText: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textMuted,
    },
}));

