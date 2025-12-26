import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface AuthorSpotlightProps {
    id: string;
    name: string;
    bio: string;
    imageUrl: string;
    onPress: () => void;
}

export const AuthorSpotlight: React.FC<AuthorSpotlightProps> = ({
    id,
    name,
    bio,
    imageUrl,
    onPress,
}) => {
    const { theme } = useUnistyles();
    const initial = name.charAt(0).toUpperCase();

    return (
        <Pressable style={styles.container} onPress={onPress}>
            {/* Left side - Avatar */}
            <View style={styles.avatarContainer}>
                <LinearGradient
                    colors={[theme.colors.primary, theme.colors.primaryDark]}
                    style={styles.avatarGradient}
                >
                    <Text style={styles.avatarText}>{initial}</Text>
                </LinearGradient>
            </View>

            {/* Right side - Content */}
            <View style={styles.content}>
                {/* Badge */}
                <View style={styles.badge}>
                    <Ionicons name="star" size={10} color={theme.colors.primary} />
                    <Text style={styles.badgeText}>Featured Author</Text>
                </View>

                {/* Name */}
                <Text style={styles.name} numberOfLines={1}>{name}</Text>

                {/* Bio */}
                <Text style={styles.bio} numberOfLines={2}>{bio}</Text>

                {/* Button */}
                <View style={styles.button}>
                    <Text style={styles.buttonText}>View Profile</Text>
                    <Ionicons name="chevron-forward" size={14} color={theme.colors.primary} />
                </View>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xl,
        padding: theme.spacing.lg,
        gap: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.sm,
    },
    avatarContainer: {
        alignSelf: 'center',
    },
    avatarGradient: {
        width: 72,
        height: 72,
        borderRadius: theme.radius.full,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: theme.typography.size.xxxl,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    content: {
        flex: 1,
        gap: theme.spacing.xs,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xxs,
        alignSelf: 'flex-start',
        backgroundColor: `${theme.colors.primary}15`,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xxs,
        borderRadius: theme.radius.full,
    },
    badgeText: {
        fontSize: theme.typography.size.xs,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.primary,
    },
    name: {
        fontSize: theme.typography.size.lg,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    bio: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textSecondary,
        lineHeight: 18,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xxs,
        marginTop: theme.spacing.xs,
    },
    buttonText: {
        fontSize: theme.typography.size.sm,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.primary,
    },
}));
