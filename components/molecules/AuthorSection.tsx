import React from 'react';
// Force reload: 1

import { View, Text, Pressable, StyleSheet as RNStyleSheet } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Typography } from '../atoms';

interface AuthorSectionProps {
    name: string;
    bio?: string;
    avatarUrl?: string;
    onPress?: () => void;
}

export const AuthorSection: React.FC<AuthorSectionProps> = ({
    name,
    bio,
    onPress,
}) => {
    const { theme } = useUnistyles();
    const { t } = useTranslation();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <Ionicons name="person" size={24} color={theme.colors.textMuted} />
                </View>
                <View style={styles.info}>
                    <Text style={styles.name}>{name}</Text>
                    <Text style={styles.role}>{t('authors.author')}</Text>
                </View>
                <Pressable onPress={onPress} style={styles.action}>
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
                </Pressable>
            </View>

            {bio && (
                <Text style={styles.bio} numberOfLines={3}>
                    {bio}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.lg,
        borderRadius: theme.radius.xl,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        gap: theme.spacing.md,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.surfaceElevated,
        alignItems: 'center',
        justifyContent: 'center',
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: theme.typography.size.lg,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    role: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textMuted,
    },
    bio: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
        lineHeight: 22,
    },
    action: {
        width: 32,
        height: 32,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.primary + '1A', // 10% opacity
        alignItems: 'center',
        justifyContent: 'center',
    },
}));
