import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface HomeHeaderProps {
    userName: string;
    userPhotoUrl?: string;
    isAnonymous?: boolean;
    onNotificationPress?: () => void;
    onSocialPress?: () => void;
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
}) => {
    const { theme } = useUnistyles();
    const { t } = useTranslation();
    const displayName = isAnonymous ? t('common.guest', 'Guest') : (userName || t('common.reader', 'Reader'));
    const avatarUrl = userPhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`;

    return (
        <View style={styles.header}>
            <View style={styles.userRow}>
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                <View style={styles.greeting}>
                    <Text style={styles.greetingLabel}>{getGreeting(t)}</Text>
                    <Text style={styles.userName}>{displayName}</Text>
                </View>
            </View>
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
        paddingVertical: theme.spacing.sm,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    avatar: {
        width: theme.avatarSize.md,
        height: theme.avatarSize.md,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.borderLight,
    },
    greeting: {
        gap: 2,
    },
    greetingLabel: {
        fontSize: theme.typography.size.xs,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    userName: {
        fontSize: theme.typography.size.xl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    notificationButton: {
        width: theme.avatarSize.md,
        height: theme.avatarSize.md,
        borderRadius: theme.radius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notificationBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 8,
        height: 8,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.primary,
        borderWidth: 2,
        borderColor: theme.colors.background,
    },
}));
