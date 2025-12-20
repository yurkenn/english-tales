import React, { useEffect } from 'react';
import { View, Pressable, Dimensions, Linking } from 'react-native';
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
                            <OptimizedImage
                                source={{ uri: profile.photoURL || '' }}
                                style={styles.avatar}
                                placeholder="person-circle"
                            />
                        </View>
                    </LinearGradient>
                </View>
            </View>

            {/* Username */}
            <Typography style={styles.username}>
                @{profile.displayName?.toLowerCase().replace(/\s+/g, '') || 'anonymous'}
            </Typography>

            {/* Stats Row */}
            <View style={styles.statsRow}>
                <Pressable style={styles.statItem}>
                    <Typography style={styles.statValue}>{profile.followingCount || 0}</Typography>
                    <Typography style={styles.statLabel}>{t('social.following', 'Following')}</Typography>
                </Pressable>

                <Pressable style={styles.statItem}>
                    <Typography style={styles.statValue}>{profile.followersCount || 0}</Typography>
                    <Typography style={styles.statLabel}>{t('social.followers', 'Followers')}</Typography>
                </Pressable>

                <Pressable style={styles.statItem}>
                    <Typography style={styles.statValue}>{profile.streak || 0}</Typography>
                    <Typography style={styles.statLabel}>🔥 {t('profile.streak', 'Streak')}</Typography>
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
                <Typography style={styles.bio}>{profile.bio}</Typography>
            ) : isSelf ? (
                <Pressable style={styles.addBioButton} onPress={onEditPress}>
                    <Typography style={styles.addBioText}>+ {t('profile.addBio', 'Add bio')}</Typography>
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
        paddingTop: 32,
        paddingBottom: 16,
        paddingHorizontal: 16,
    },
    avatarSection: {
        marginBottom: 8,
    },
    avatarWrapper: {
        position: 'relative',
    },
    avatarRing: {
        width: 100,
        height: 100,
        borderRadius: 50,
        padding: 3,
    },
    avatarInner: {
        flex: 1,
        borderRadius: 47,
        overflow: 'hidden',
        backgroundColor: theme.colors.background,
        padding: 2,
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 45,
    },
    username: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 16,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 16,
        gap: 24,
    },
    statItem: {
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    statValue: {
        fontSize: 17,
        fontWeight: '700',
        color: theme.colors.text,
    },
    statLabel: {
        fontSize: 12,
        color: theme.colors.textMuted,
        marginTop: 2,
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    editButton: {
        paddingVertical: 10,
        paddingHorizontal: 32,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
    },
    editButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text,
    },
    followButton: {
        paddingVertical: 10,
        paddingHorizontal: 32,
        borderRadius: 6,
        backgroundColor: theme.colors.primary,
    },
    followButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    socialIcon: {
        width: 40,
        height: 40,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: theme.colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bio: {
        fontSize: 14,
        color: theme.colors.text,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 8,
        paddingHorizontal: 16,
    },
    addBioButton: {
        marginBottom: 8,
    },
    addBioText: {
        fontSize: 14,
        color: theme.colors.textMuted,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    locationText: {
        fontSize: 14,
        color: theme.colors.textMuted,
    },
}));
