import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';

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

    const avatarUri = photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(isAnonymous ? 'Guest' : displayName || 'User')}`;
    const name = isAnonymous ? 'Guest User' : (displayName || 'Reader');
    const subtitle = isAnonymous ? 'Sign up to sync your progress' : email;

    return (
        <View style={styles.container}>
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
            <Text style={styles.userName}>{name}</Text>
            <Text style={styles.userEmail}>{subtitle}</Text>

            {!isAnonymous && onEditPress && (
                <Pressable style={styles.editButton} onPress={onEditPress}>
                    <Ionicons name="pencil-outline" size={16} color={theme.colors.primary} />
                    <Text style={styles.editButtonText}>Edit Profile</Text>
                </Pressable>
            )}

            {isAnonymous && onSignInPress && (
                <Pressable style={styles.editButton} onPress={onSignInPress}>
                    <Text style={styles.editButtonText}>Sign In / Sign Up</Text>
                </Pressable>
            )}
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        alignItems: 'center',
        paddingVertical: theme.spacing.xl,
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.xl,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xxl,
        ...theme.shadows.md,
    },
    avatar: {
        width: theme.avatarSize.xl,
        height: theme.avatarSize.xl,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.borderLight,
        marginBottom: theme.spacing.md,
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
        marginBottom: theme.spacing.lg,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.radius.full,
        borderWidth: 1,
        borderColor: theme.colors.primary,
    },
    editButtonText: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.primary,
    },
}));
