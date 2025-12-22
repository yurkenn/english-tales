import React from 'react';
import { View, Text, Image, Pressable, ImageSourcePropType } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

// Default mascot avatar for users without profile photo
const DEFAULT_AVATAR = require('@/assets/default-avatar.png');

interface HomeHeaderProps {
    userName: string;
    userPhotoUrl?: string;
    isAnonymous?: boolean;
    onNotificationPress?: () => void;
    onSocialPress?: () => void;
    onProfilePress?: () => void;
}

const getGreeting = (t: any) => {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.greeting_morning', 'Good Morning');
    if (hour < 17) return t('home.greeting_afternoon', 'Good Afternoon');
    return t('home.greeting_evening', 'Good Evening');
};

export const HomeHeader: React.FC<HomeHeaderProps> = ({
    userName,
    userPhotoUrl,
    isAnonymous,
    onNotificationPress,
    onSocialPress,
    onProfilePress,
}) => {
    const { theme } = useUnistyles();
    const { t } = useTranslation();
    const displayName = isAnonymous ? t('common.guest', 'Guest') : (userName || t('common.reader', 'Reader'));
    const avatarSource: ImageSourcePropType = userPhotoUrl ? { uri: userPhotoUrl } : DEFAULT_AVATAR;

    return (
        <View style={styles.header}>
            <Pressable style={styles.userRow} onPress={onProfilePress}>
                <Image source={avatarSource} style={styles.avatar} />
                <View style={styles.greeting}>
                    <Text style={styles.greetingLabel}>{getGreeting(t)}</Text>
                    <Text style={styles.userName}>{displayName}</Text>
                </View>
            </Pressable>
            <View style={styles.actionRow}>
                <Pressable
                    style={styles.notificationButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={onSocialPress}
                >
                    <Ionicons
                        name="people-outline"
                        size={theme.iconSize.md}
                        color={theme.colors.text}
                    />
                </Pressable>
                <Pressable
                    style={styles.notificationButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={onNotificationPress}
                >
                    <Ionicons
                        name="notifications-outline"
                        size={theme.iconSize.md}
                        color={theme.colors.text}
                    />
                    <View style={styles.notificationBadge} />
                </Pressable>
            </View>
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.md,
        paddingBottom: theme.spacing.sm,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.colors.background,
        borderWidth: 1.5,
        borderColor: theme.colors.surface,
        ...theme.shadows.sm,
    },
    greeting: {
        gap: 0,
    },
    greetingLabel: {
        fontSize: theme.typography.size.xs,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    userName: {
        fontSize: theme.typography.size.xl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    notificationButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.sm,
    },
    notificationBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: theme.colors.primary,
        borderWidth: 2,
        borderColor: theme.colors.surface,
    },
}));
